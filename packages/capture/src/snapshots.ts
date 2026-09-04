import pixelmatch from "pixelmatch";
import { chromium, firefox, webkit, type Page } from "playwright";
import { PNG } from "pngjs";

import { withBundleDir } from "@ovr/builds/storybookBundleCache";
import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import type { BuildDbSchema } from "@ovr/db/repository/builds";
import type { SnapshotDbSchema } from "@ovr/db/repository/snapshots";
import { createLogger } from "@ovr/logger";
import { enqueueDiff, enqueueFinalize } from "@ovr/queue/producer";
import { promoteBaseline } from "@ovr/reviews/baselines";
import { storage } from "@ovr/storage";

import { detectCaptureStrategy, type CaptureStrategy } from "./captureStrategies";
import { SIGNAL_HANDLING_OPTIONS, newPage } from "./lib/browser";
import {
  BOOT_TIMEOUT_MS,
  CAPTURE_JOB_TIMEOUT_MS,
  RENDER_TIMEOUT_MS,
  withTimeout,
} from "./lib/captureTimeouts";
import { startStaticProxy, type StaticProxy } from "./lib/staticProxy";

const logger = createLogger("capture");

const DEFAULT_PIXELMATCH_THRESHOLD = 0.1;

const DEFAULT_VIEWPORT_HEIGHT = 800;

type CapturePhase = "render" | "screenshot" | "upload";

type CaptureTimings = Record<CapturePhase, number>;

type SnapshotLogContext = {
  buildId: string;
  snapshotId: string;
  storyId: string;
  viewportWidth: number;
  viewportHeight: number;
  fullPage: boolean;
};

export class ShutdownInterruptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShutdownInterruptError";
  }
}

class CapturePhaseError extends Error {
  constructor(
    readonly phase: CapturePhase,
    readonly durationMs: number,
    cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause), { cause });
    this.name = "CapturePhaseError";
  }
}

const runPhase = async <T>(phase: CapturePhase, run: () => Promise<T>): Promise<[T, number]> => {
  const start = performance.now();
  try {
    const result = await run();
    return [result, Math.round(performance.now() - start)];
  } catch (cause) {
    throw new CapturePhaseError(phase, Math.round(performance.now() - start), cause);
  }
};

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

type CapturePage = {
  page: Page;
  pageLogState: PageLogState;
  close: () => Promise<void>;
};

const launchCapturePage = async (
  buildId: string,
  browserName: string,
  proxy: StaticProxy,
  strategy: CaptureStrategy,
): Promise<CapturePage> => {
  const browser = await getBrowserLauncher(browserName).launch({
    ...SIGNAL_HANDLING_OPTIONS,
    ...(browserName === "chromium" ? { args: ["--disable-dev-shm-usage"] } : {}),
  });

  let closeRequested = false;
  browser.on("disconnected", () => {
    if (closeRequested) {
      return;
    }
    logger.error({ buildId, browser: browserName }, "capture browser disconnected unexpectedly");
  });

  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await newPage(context);
  page.on("crash", () => {
    logger.error({ buildId, browser: browserName }, "capture page crashed");
  });

  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === proxy.origin || url.protocol === "data:" || url.protocol === "blob:") {
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

  const bootStart = performance.now();
  await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });
  await strategy.waitForBoot(page, BOOT_TIMEOUT_MS);
  logger.info(
    { buildId, browser: browserName, bootMs: Math.round(performance.now() - bootStart) },
    "capture page booted",
  );

  return {
    page,
    pageLogState,
    close: async () => {
      closeRequested = true;
      await browser.close();
    },
  };
};

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

  const startedAt = performance.now();
  const context: SnapshotLogContext = {
    buildId: build.id,
    snapshotId,
    storyId: snapshot.targetId,
    viewportWidth: snapshot.viewportWidth,
    viewportHeight: snapshot.viewportHeight,
    fullPage,
  };

  try {
    const [renderResult, renderMs] = await runPhase("render", () =>
      page.evaluate(strategy.waitForTargetPlayed, {
        targetId: snapshot.targetId,
        timeoutMs: RENDER_TIMEOUT_MS,
      }),
    );

    if (!renderResult.ok) {
      pageLogState.logs.push({
        level: "error",
        message: renderResult.error ?? "target failed to render",
      });
    }

    const imagePath = `${build.projectId}/builds/${build.id}/snapshots/${snapshotId}.png`;

    const [screenshot, screenshotMs] = await runPhase("screenshot", () =>
      page.screenshot({ fullPage, animations: "disabled" }),
    );

    const [, uploadMs] = await runPhase("upload", () =>
      storage.uploadFile(imagePath, screenshot, "image/png"),
    );

    const hasRenderError = !renderResult.ok || pageLogState.hasPageError;

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

    const timings: CaptureTimings = {
      render: renderMs,
      screenshot: screenshotMs,
      upload: uploadMs,
    };
    logger.info(
      { ...context, timings, totalMs: Math.round(performance.now() - startedAt), hasRenderError },
      "snapshot captured",
    );

    if (!captured) {
      return;
    }

    await enqueueSnapshotDiff(snapshotId);
  } catch (error) {
    const failedPhase = error instanceof CapturePhaseError ? error.phase : undefined;
    const failedPhaseMs = error instanceof CapturePhaseError ? error.durationMs : undefined;
    const cause = error instanceof CapturePhaseError ? error.cause : error;
    logger.error(
      {
        ...context,
        failedPhase,
        failedPhaseMs,
        totalMs: Math.round(performance.now() - startedAt),
        err: cause,
      },
      "snapshot capture failed",
    );
    throw cause;
  }
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

type CaptureBuildGroupOptions = {
  shutdownSignal?: AbortSignal;
};

export const captureBuildGroup = async (
  buildId: string,
  browser: string,
  snapshotIds: string[],
  { shutdownSignal }: CaptureBuildGroupOptions = {},
): Promise<void> => {
  const build = await dbClient.builds.findById(buildId);
  if (!build) {
    throw new Error(`Missing build: ${buildId}`);
  }

  await withTimeout(
    (signal) =>
      withBundleDir(build.id, build.artifactPath, async (bundleDir) => {
        const proxy = await startStaticProxy(bundleDir);
        const strategy = await detectCaptureStrategy(bundleDir);

        logger.info(
          { buildId, browser, snapshotCount: snapshotIds.length },
          "capture group started",
        );

        let capturePage = await launchCapturePage(buildId, browser, proxy, strategy);

        try {
          for (const [index, snapshotId] of snapshotIds.entries()) {
            if (shutdownSignal?.aborted) {
              throw new ShutdownInterruptError(
                `Capture group interrupted by worker shutdown: ${buildId}`,
              );
            }

            if (signal.aborted) {
              break;
            }

            try {
              await captureSnapshotOnPage(
                capturePage.page,
                strategy,
                build,
                snapshotId,
                capturePage.pageLogState,
              );
            } catch (error) {
              if (shutdownSignal?.aborted) {
                logger.warn(
                  { buildId, browser, snapshotId, err: error },
                  "capture interrupted by shutdown, leaving the group for a retry",
                );
                throw error;
              }

              await markSnapshotErrored(snapshotId, error);

              if (!capturePage.page.isClosed()) {
                continue;
              }

              logger.error(
                { buildId, browser, snapshotId },
                "capture browser closed mid-group, relaunching for remaining snapshots",
              );
              await capturePage.close().catch(() => undefined);

              try {
                capturePage = await launchCapturePage(buildId, browser, proxy, strategy);
              } catch (relaunchError) {
                logger.error(
                  { buildId, browser, err: relaunchError },
                  "failed to relaunch capture browser, aborting remaining snapshots",
                );
                for (const remainingId of snapshotIds.slice(index + 1)) {
                  await markSnapshotErrored(remainingId, relaunchError);
                }
                return;
              }
            } finally {
              capturePage.pageLogState.logs = [];
              capturePage.pageLogState.hasPageError = false;
            }
          }
        } finally {
          await capturePage.close();
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

  const diffImagePath = diff?.pixelDiffCount
    ? await uploadDiffImage(build.projectId, build.id, diffId, diff)
    : undefined;

  if (isMainBranch) {
    // No baseline means the target is brand new, not unchanged.
    const changed = !diff || diff.diffPercent > snapshot.diffThreshold;

    await dbClient.diffs.updateResult(diffId, {
      processingStatus: "success",
      reviewStatus: changed ? "auto_approved" : "unchanged",
      ...(baselineSnapshot && { baselineSnapshotId: baselineSnapshot.id }),
      ...(diff && { pixelDiffCount: diff.pixelDiffCount, diffPercent: diff.diffPercent }),
      ...(diffImagePath && { diffImagePath }),
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
      reviewStatus: "unchanged",
      baselineSnapshotId: diff.baselineSnapshotId,
      pixelDiffCount,
      diffPercent,
      ...(diffImagePath && { diffImagePath }),
    });
    await checkAllDoneAndFinalize(build.id);
    return;
  }

  await dbClient.diffs.updateResult(diffId, {
    processingStatus: "success",
    reviewStatus: "needs_review",
    baselineSnapshotId: diff.baselineSnapshotId,
    ...(diffImagePath && { diffImagePath }),
    pixelDiffCount,
    diffPercent,
  });

  await checkAllDoneAndFinalize(build.id);
};

const uploadDiffImage = async (
  projectId: string,
  buildId: string,
  diffId: string,
  diff: { width: number; height: number; diffPixels: Uint8Array },
): Promise<string> => {
  const diffImagePath = `${projectId}/builds/${buildId}/diffs/${diffId}.png`;
  await storage.uploadFile(
    diffImagePath,
    encodePng(diff.diffPixels, diff.width, diff.height),
    "image/png",
  );
  return diffImagePath;
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
