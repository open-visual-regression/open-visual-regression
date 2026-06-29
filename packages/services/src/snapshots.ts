import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { chromium, firefox, webkit } from "playwright";

import { dbClient } from "@ovr/db/client";
import type { SnapshotDbSchema } from "@ovr/db/repository/snapshots";
import { db } from "@ovr/db/db";
import { storage } from "@ovr/storage";

import { promoteBaseline } from "./baselines";
import { detectCaptureStrategy } from "./captureStrategies";
import { BOOT_TIMEOUT_MS, RENDER_TIMEOUT_MS } from "./lib/captureTimeouts";
import { startStaticProxy } from "./lib/staticProxy";
import { enqueueDiff, enqueueFinalize } from "./lib/queue";

const DEFAULT_PIXELMATCH_THRESHOLD = 0.1;

type ConsoleLog = { level: string; message: string };

const DEFAULT_VIEWPORT_HEIGHT = 800;

const BROWSER_LAUNCHERS = { chromium, firefox, webkit };

const getBrowserLauncher = (browser: string) => {
  const launcher = BROWSER_LAUNCHERS[browser as keyof typeof BROWSER_LAUNCHERS];
  if (!launcher) {
    throw new Error(`Unsupported browser: ${browser}`);
  }
  return launcher;
};

export const captureSnapshot = async (snapshotId: string): Promise<void> => {
  const snapshot = await dbClient.snapshots.findById(snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  const build = await dbClient.builds.findById(snapshot.buildId);

  if (!build) {
    throw new Error(`Missing build for snapshot: ${snapshotId}`);
  }

  await dbClient.snapshots.updateStatus(snapshotId, "processing");

  const fullPage = snapshot.viewportHeight === 0;

  const { logs, screenshot, hasRenderError } = await (async () => {
    const proxy = await startStaticProxy(build.projectId, build.id);
    const browser = await getBrowserLauncher(snapshot.browser).launch();

    try {
      const context = await browser.newContext({
        viewport: {
          width: snapshot.viewportWidth,
          height: fullPage ? DEFAULT_VIEWPORT_HEIGHT : snapshot.viewportHeight,
        },
        deviceScaleFactor: 1,
      });

      const page = await context.newPage();
      const logs: ConsoleLog[] = [];
      let hasPageError = false;

      page.on("console", (message) => {
        logs.push({ level: message.type(), message: message.text() });
      });

      page.on("pageerror", (error) => {
        hasPageError = true;
        logs.push({ level: "error", message: error.message });
      });

      await page.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (url.origin === proxy.origin || url.protocol === "data:" || url.protocol === "blob:") {
          return route.continue();
        }
        return route.abort();
      });

      const strategy = await detectCaptureStrategy(proxy.origin);

      await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });
      await strategy.waitForBoot(page, BOOT_TIMEOUT_MS);

      const renderResult = await page.evaluate(strategy.waitForTargetPlayed, {
        targetId: snapshot.targetId,
        timeoutMs: RENDER_TIMEOUT_MS,
      });

      if (!renderResult.ok) {
        logs.push({ level: "error", message: renderResult.error ?? "target failed to render" });
      }

      return {
        logs,
        screenshot: await page.screenshot({ fullPage }),
        hasRenderError: !renderResult.ok || hasPageError,
      };
    } finally {
      await browser.close();
      proxy.close();
    }
  })();

  const imagePath = `${build.projectId}/builds/${build.id}/snapshots/${snapshotId}.png`;
  await storage.uploadFile(imagePath, screenshot, "image/png");

  await db.transaction(async (tx) => {
    if (logs.length > 0) {
      await dbClient.snapshotLogs.createMany({
        values: logs.map((log) => ({ snapshotId, level: log.level, message: log.message })),
        tx,
      });
    }

    await dbClient.snapshots.updateCaptureResult(snapshotId, {
      status: "success",
      imagePath,
      hasRenderError,
      tx,
    });
  });

  await enqueueSnapshotDiff(snapshotId);
};

export const enqueueSnapshotDiff = async (snapshotId: string): Promise<void> => {
  await dbClient.diffs.createMany({ values: [{ snapshotId }] });
  const diff = await dbClient.diffs.findBySnapshot(snapshotId);
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
