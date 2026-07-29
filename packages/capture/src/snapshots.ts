import pixelmatch from "pixelmatch";
import { chromium, firefox, webkit, type Page } from "playwright";
import { PNG } from "pngjs";

import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import type { BuildDbSchema } from "@ovr/db/repository/builds";
import type { SnapshotDbSchema } from "@ovr/db/repository/snapshots";
import { enqueueDiff, enqueueFinalize } from "@ovr/queue/producer";
import { promoteBaseline } from "@ovr/reviews/baselines";
import { storage } from "@ovr/storage";

import { detectCaptureStrategy, type CaptureStrategy } from "./captureStrategies";
import { withExtractedBundle } from "./lib/artifact";
import { CHROMIUM_LAUNCH_ARGS, newPage } from "./lib/browser";
import {
  BOOT_TIMEOUT_MS,
  CAPTURE_JOB_TIMEOUT_MS,
  RENDER_TIMEOUT_MS,
  withTimeout,
} from "./lib/captureTimeouts";
import { startStaticProxy } from "./lib/staticProxy";

const DEFAULT_PIXELMATCH_THRESHOLD = 0.1;

const DEFAULT_VIEWPORT_HEIGHT = 800;

const BROWSER_LAUNCHERS = { chromium, firefox, webkit };

const getBrowserLauncher = (browser: string) => {
  const launcher = BROWSER_LAUNCHERS[browser as keyof typeof BROWSER_LAUNCHERS];
  if (!launcher) {
    throw new Error(`Unsupported browser: ${browser}`);
  }
  return launcher;
};

type CaptureLog = { level: string; message: string };
type PageLogState = { logs: CaptureLog[]; hasPageError: boolean };

const captureSnapshotOnPage = async (
  page: Page,
  strategy: CaptureStrategy,
  build: NonNullable<BuildDbSchema>,
  snapshotId: string,
  pageLogState: PageLogState,
): Promise<void> => {
  const snapshot = await dbClient.snapshots.findById(snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  if (snapshot.status === "success" || snapshot.status === "canceled") {
    return;
  }

  await dbClient.snapshots.updateStatus(snapshotId, "processing");

  const fullPage = snapshot.viewportHeight === 0;

  await page.setViewportSize({
    width: snapshot.viewportWidth,
    height: fullPage ? DEFAULT_VIEWPORT_HEIGHT : snapshot.viewportHeight,
  });

  const renderResult = await page.evaluate(strategy.waitForTargetPlayed, {
    targetId: snapshot.targetId,
    timeoutMs: RENDER_TIMEOUT_MS,
  });

  if (!renderResult.ok) {
    pageLogState.logs.push({
      level: "error",
      message: renderResult.error ?? "target failed to render",
    });
  }

  const screenshot = await page.screenshot({ fullPage, animations: "disabled" });
  const hasRenderError = !renderResult.ok || pageLogState.hasPageError;
  const imagePath = `${build.projectId}/builds/${build.id}/snapshots/${snapshotId}.png`;
  await storage.uploadFile(imagePath, screenshot, "image/png");

  const captured = await db.transaction(async (tx) => {
    if (pageLogState.logs.length > 0) {
      await dbClient.snapshotLogs.createMany({
        values: pageLogState.logs.map((log) => ({
          snapshotId,
          level: log.level,
          message: log.message,
        })),
        tx,
      });
    }

    return dbClient.snapshots.updateCaptureResult(snapshotId, {
      status: "success",
      imagePath,
      hasRenderError,
      tx,
    });
  });

  if (!captured) {
    return;
  }

  await enqueueSnapshotDiff(snapshotId);
};

export const markSnapshotErrored = async (snapshotId: string, error: unknown): Promise<void> => {
  const snapshot = await dbClient.snapshots.findById(snapshotId);
  if (snapshot?.status === "canceled") {
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  await dbClient.snapshotLogs.createMany({ values: [{ snapshotId, level: "error", message }] });
  await dbClient.snapshots.updateStatus(snapshotId, "error");
  await enqueueSnapshotDiff(snapshotId);
};

export const captureBuildGroup = async (
  buildId: string,
  browser: string,
  snapshotIds: string[],
): Promise<void> => {
  const build = await dbClient.builds.findById(buildId);
  if (!build) {
    throw new Error(`Missing build: ${buildId}`);
  }

  await withTimeout(
    (signal) =>
      withExtractedBundle(build.artifactPath, async (bundleDir) => {
        const proxy = await startStaticProxy(bundleDir);
        const launchedBrowser = await getBrowserLauncher(browser).launch(
          browser === "chromium" ? { args: CHROMIUM_LAUNCH_ARGS } : undefined,
        );

        try {
          const context = await launchedBrowser.newContext({ deviceScaleFactor: 1 });
          const page = await newPage(context);

          await page.route("**/*", (route) => {
            const url = new URL(route.request().url());
            if (
              url.origin === proxy.origin ||
              url.protocol === "data:" ||
              url.protocol === "blob:"
            ) {
              return route.continue();
            }
            return route.abort();
          });

          const pageLogState: PageLogState = { logs: [], hasPageError: false };
          page.on("console", (message) => {
            pageLogState.logs.push({ level: message.type(), message: message.text() });
          });
          page.on("pageerror", (error) => {
            pageLogState.hasPageError = true;
            pageLogState.logs.push({ level: "error", message: error.message });
          });

          const strategy = await detectCaptureStrategy(proxy.origin);
          await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });
          await strategy.waitForBoot(page, BOOT_TIMEOUT_MS);

          for (const snapshotId of snapshotIds) {
            if (signal.aborted) {
              break;
            }

            try {
              await captureSnapshotOnPage(page, strategy, build, snapshotId, pageLogState);
            } catch (error) {
              await markSnapshotErrored(snapshotId, error);
            } finally {
              pageLogState.logs = [];
              pageLogState.hasPageError = false;
            }
          }
        } finally {
          await launchedBrowser.close();
          proxy.close();
        }
      }),
    CAPTURE_JOB_TIMEOUT_MS * snapshotIds.length,
  );
};

export const enqueueSnapshotDiff = async (snapshotId: string): Promise<void> => {
  const [created] = await dbClient.diffs.createMany({ values: [{ snapshotId }] });
  const diff = created ?? (await dbClient.diffs.findBySnapshot(snapshotId));

  if (diff?.processingStatus === "pending") {
    await enqueueDiff({ snapshotId, diffId: diff.id });
  }
};

export const diffSnapshot = async (snapshotId: string, diffId: string): Promise<void> => {
  const snapshot = await dbClient.snapshots.findById(snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  const build = await dbClient.builds.findById(snapshot.buildId);
  if (!build) {
    throw new Error(`Build not found for snapshot: ${snapshotId}`);
  }

  if (build.processingStatus === "canceled" || snapshot.status === "canceled") {
    return;
  }

  const project = await dbClient.projects.findById(build.projectId);
  if (!project) {
    throw new Error(`Project not found for build: ${build.id}`);
  }

  if (snapshot.status === "error" || snapshot.hasRenderError) {
    await dbClient.diffs.updateProcessingStatus(diffId, "error");
    await checkAllDoneAndFinalize(build.id);
    return;
  }

  const isMainBranch = build.branch === project.gitMainBranch;

  const baseline = await dbClient.baselines.find({
    projectId: project.id,
    browser: snapshot.browser,
    viewportWidth: snapshot.viewportWidth,
    viewportHeight: snapshot.viewportHeight,
    targetId: snapshot.targetId,
  });

  if (!snapshot.imagePath) {
    throw new Error(`Snapshot has no captured image: ${snapshotId}`);
  }

  const baselineSnapshot = baseline ? await dbClient.snapshots.findById(baseline.snapshotId) : null;
  const diff = await diffAgainstBaselineSnapshot(snapshot.imagePath, baselineSnapshot);

  if (isMainBranch) {
    await dbClient.diffs.updateResult(diffId, {
      processingStatus: "success",
      reviewStatus: "not_required",
      ...(baselineSnapshot && { baselineSnapshotId: baselineSnapshot.id }),
      ...(diff && { pixelDiffCount: diff.pixelDiffCount, diffPercent: diff.diffPercent }),
    });
    await promoteBaseline(diffId, build.createdBy);
    await checkAllDoneAndFinalize(build.id);
    return;
  }

  if (!diff) {
    await dbClient.diffs.updateResult(diffId, {
      processingStatus: "success",
      reviewStatus: "needs_review",
      ...(baselineSnapshot && { baselineSnapshotId: baselineSnapshot.id }),
    });
    await checkAllDoneAndFinalize(build.id);
    return;
  }

  const { pixelDiffCount, diffPercent } = diff;

  if (diffPercent === 0 || diffPercent <= snapshot.diffThreshold) {
    await dbClient.diffs.updateResult(diffId, {
      processingStatus: "success",
      reviewStatus: "not_required",
      baselineSnapshotId: diff.baselineSnapshotId,
      pixelDiffCount,
      diffPercent,
    });
    await checkAllDoneAndFinalize(build.id);
    return;
  }

  const diffImagePath = `${build.projectId}/builds/${build.id}/diffs/${diffId}.png`;
  await storage.uploadFile(
    diffImagePath,
    encodePng(diff.diffPixels, diff.width, diff.height),
    "image/png",
  );

  await dbClient.diffs.updateResult(diffId, {
    processingStatus: "success",
    reviewStatus: "needs_review",
    baselineSnapshotId: diff.baselineSnapshotId,
    diffImagePath,
    pixelDiffCount,
    diffPercent,
  });

  await checkAllDoneAndFinalize(build.id);
};

const diffAgainstBaselineSnapshot = async (
  capturePath: string,
  baselineSnapshot: SnapshotDbSchema | null | undefined,
) => {
  if (!baselineSnapshot?.imagePath) {
    return null;
  }

  const diffResult = await computeDiffAgainstBaseline(capturePath, baselineSnapshot.imagePath);
  return { ...diffResult, baselineSnapshotId: baselineSnapshot.id };
};

const computeDiffAgainstBaseline = async (
  capturePath: string,
  baselinePath: string,
): Promise<{
  width: number;
  height: number;
  pixelDiffCount: number;
  diffPercent: number;
  diffPixels: Uint8Array;
}> => {
  const [capturePixels, baselinePixels] = await Promise.all([
    readPng(capturePath),
    readPng(baselinePath),
  ]);

  const width = Math.max(capturePixels.width, baselinePixels.width);
  const height = Math.max(capturePixels.height, baselinePixels.height);

  const capturePadded = padToCanvas(capturePixels, width, height);
  const baselinePadded = padToCanvas(baselinePixels, width, height);
  const diffPixels = new Uint8Array(width * height * 4);

  const pixelDiffCount = pixelmatch(baselinePadded, capturePadded, diffPixels, width, height, {
    threshold: DEFAULT_PIXELMATCH_THRESHOLD,
    diffMask: true,
  });

  const diffPercent = (pixelDiffCount / (width * height)) * 100;

  return { width, height, pixelDiffCount, diffPercent, diffPixels };
};

const padToCanvas = (pixels: PNG, width: number, height: number): Uint8Array => {
  if (pixels.width === width && pixels.height === height) {
    return pixels.data;
  }

  const padded = new Uint8Array(width * height * 4);
  for (let y = 0; y < pixels.height; y++) {
    const srcStart = y * pixels.width * 4;
    const destStart = y * width * 4;
    padded.set(pixels.data.subarray(srcStart, srcStart + pixels.width * 4), destStart);
  }
  return padded;
};

export const checkAllDoneAndFinalize = async (buildId: string): Promise<void> => {
  if (await dbClient.diffs.hasAllDoneForBuild(buildId)) {
    await enqueueFinalize({ buildId });
  }
};

const PNG_READ_TIMEOUT_MS = 30_000;

const readPng = async (imagePath: string): Promise<PNG> => {
  const stream = await storage.getFileStream(imagePath);
  const png = new PNG();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      stream.destroy();
      reject(new Error(`Timed out reading PNG: ${imagePath}`));
    }, PNG_READ_TIMEOUT_MS);

    const done = (result: PNG | Error) => {
      clearTimeout(timeout);
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    };

    stream.on("error", done);
    stream
      .pipe(png)
      .on("parsed", () => done(png))
      .on("error", done);
  });
};

const encodePng = (pixels: Uint8Array, width: number, height: number): Buffer => {
  const png = new PNG({ width, height });
  png.data = Buffer.from(pixels);
  return PNG.sync.write(png);
};
