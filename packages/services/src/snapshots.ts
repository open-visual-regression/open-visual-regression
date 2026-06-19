import http from "node:http";
import path from "node:path";

import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { chromium } from "playwright";

import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { storage } from "@ovr/storage";

import { promoteBaseline } from "./baselines";
import { detectCaptureStrategy } from "./captureStrategies";
import { getContentType, getStaticPath } from "./extract";
import { enqueueDiff, enqueueFinalize } from "./lib/queue";

const DEFAULT_PIXELMATCH_THRESHOLD = 0.1;

const startStaticProxy = (buildId: string): Promise<{ origin: string; close: () => void }> =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const requestedPath = decodeURIComponent((req.url ?? "/").split("?")[0]!).replace(/^\/+/, "");
      const relativePath = path.posix.normalize(requestedPath);

      if (relativePath === ".." || relativePath.startsWith("../")) {
        res.writeHead(403);
        res.end();
        return;
      }

      storage
        .getFileStream(getStaticPath(buildId, relativePath))
        .then((stream) => {
          res.writeHead(200, { "Content-Type": getContentType(relativePath) });
          stream.pipe(res);
        })
        .catch(() => {
          res.writeHead(404);
          res.end();
        });
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        throw new Error("Expected the static proxy server to bind to a TCP port");
      }
      resolve({
        origin: `http://127.0.0.1:${address.port}`,
        close: () => server.close(),
      });
    });
  });

type ConsoleLog = { level: string; message: string };

const BOOT_TIMEOUT_MS = 10_000;
const RENDER_TIMEOUT_MS = 30_000;

export const captureSnapshot = async (snapshotId: string): Promise<void> => {
  const snapshot = await dbClient.snapshots.findById(snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  const [build, captureConfiguration] = await Promise.all([
    dbClient.builds.findById(snapshot.buildId),
    dbClient.captureConfigurations.findById(snapshot.captureConfigurationId),
  ]);

  if (!build || !captureConfiguration) {
    throw new Error(`Missing build or capture configuration for snapshot: ${snapshotId}`);
  }

  const proxy = await startStaticProxy(build.id);
  const browser = await chromium.launch();

  const logs: ConsoleLog[] = [];

  const { screenshot, renderFailed } = await (async () => {
    try {
      const context = await browser.newContext({
        viewport: {
          width: captureConfiguration.viewportWidth,
          height: captureConfiguration.viewportHeight,
        },
      });
      const page = await context.newPage();

      page.on("console", (message) => {
        logs.push({ level: message.type(), message: message.text() });
      });

      page.on("pageerror", (error) => {
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

      const renderResult = await page.evaluate(strategy.waitForTargetRendered, {
        targetId: snapshot.targetId,
        timeoutMs: RENDER_TIMEOUT_MS,
      });

      if (!renderResult.ok) {
        logs.push({ level: "error", message: renderResult.error ?? "target failed to render" });
      }

      return { screenshot: await page.screenshot(), renderFailed: !renderResult.ok };
    } finally {
      await browser.close();
      proxy.close();
    }
  })();

  const hasRenderError = renderFailed || logs.some((log) => log.level === "error");

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
      status: "captured",
      imagePath,
      hasRenderError,
      tx,
    });
  });

  await enqueueDiffsIfAllCaptured(build.id);
};

export const enqueueDiffsIfAllCaptured = async (buildId: string): Promise<void> => {
  if (await dbClient.snapshots.hasAllCapturedForBuild(buildId)) {
    const snapshots = await dbClient.snapshots.findByBuild(buildId);
    const diffs = await dbClient.diffs.createMany({
      values: snapshots.map((s) => ({ snapshotId: s.id })),
    });
    await Promise.all(
      diffs.map((diff) => enqueueDiff({ snapshotId: diff.snapshotId, diffId: diff.id })),
    );
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

  const isMainBranch = build.branch === project.gitMainBranch;

  const baseline = await dbClient.baselines.find(
    project.id,
    snapshot.captureConfigurationId,
    snapshot.targetId,
  );

  if (!snapshot.imagePath) {
    throw new Error(`Snapshot has no captured image: ${snapshotId}`);
  }

  const baselineSnapshot = baseline ? await dbClient.snapshots.findById(baseline.snapshotId) : null;
  const diff = baselineSnapshot?.imagePath
    ? await computeDiffAgainstBaseline(snapshot.imagePath, baselineSnapshot.imagePath)
    : null;

  if (isMainBranch) {
    await dbClient.diffs.updateResult(diffId, {
      processingStatus: "diffed",
      reviewStatus: "not_required",
      ...(diff && { pixelDiffCount: diff.pixelDiffCount, diffPercent: diff.diffPercent }),
    });
    await promoteBaseline(diffId, build.createdBy);
    await checkAllDoneAndFinalize(build.id);
    return;
  }

  if (!diff) {
    await dbClient.diffs.updateResult(diffId, {
      processingStatus: "diffed",
      reviewStatus: "awaiting_review",
    });
    await checkAllDoneAndFinalize(build.id);
    return;
  }

  const { pixelDiffCount, diffPercent } = diff;

  if (diffPercent === 0 || diffPercent <= project.diffThreshold) {
    await dbClient.diffs.updateResult(diffId, {
      processingStatus: "diffed",
      reviewStatus: "not_required",
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
    processingStatus: "diffed",
    reviewStatus: "awaiting_review",
    diffImagePath,
    pixelDiffCount,
    diffPercent,
  });

  await checkAllDoneAndFinalize(build.id);
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
} | null> => {
  const [capturePixels, baselinePixels] = await Promise.all([
    readPng(capturePath),
    readPng(baselinePath),
  ]);

  if (
    capturePixels.width !== baselinePixels.width ||
    capturePixels.height !== baselinePixels.height
  ) {
    return null;
  }

  const width = capturePixels.width;
  const height = capturePixels.height;
  const diffPixels = new Uint8Array(width * height * 4);

  const pixelDiffCount = pixelmatch(
    baselinePixels.data,
    capturePixels.data,
    diffPixels,
    width,
    height,
    { threshold: DEFAULT_PIXELMATCH_THRESHOLD },
  );

  const diffPercent = (pixelDiffCount / (width * height)) * 100;

  return { width, height, pixelDiffCount, diffPercent, diffPixels };
};

export const checkAllDoneAndFinalize = async (buildId: string): Promise<void> => {
  if (await dbClient.diffs.hasAllDoneForBuild(buildId)) {
    await enqueueFinalize({ buildId });
  }
};

const readPng = async (imagePath: string): Promise<PNG> => {
  const stream = await storage.getFileStream(imagePath);
  const png = new PNG();
  return new Promise((resolve, reject) => {
    stream
      .pipe(png)
      .on("parsed", () => resolve(png))
      .on("error", reject);
  });
};

const encodePng = (pixels: Uint8Array, width: number, height: number): Buffer => {
  const png = new PNG({ width, height });
  png.data = Buffer.from(pixels);
  return PNG.sync.write(png);
};
