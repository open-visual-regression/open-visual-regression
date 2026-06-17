import http from "node:http";

import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { chromium } from "playwright";

import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { getContentType, getStaticPath } from "./extract";
import { enqueueDiff, enqueueFinalize } from "./lib/queue";

const DEFAULT_PIXELMATCH_THRESHOLD = 0.1;

const startStaticProxy = (buildId: string): Promise<{ origin: string; close: () => void }> =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const relativePath = decodeURIComponent((req.url ?? "/").split("?")[0]!).replace(/^\/+/, "");

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

const STORYBOOK_BOOT_TIMEOUT_MS = 10_000;
const STORY_RENDER_TIMEOUT_MS = 30_000;

type StoryRenderResult = { ok: boolean; error?: string };

type StorybookChannel = {
  on: (event: string, listener: (...args: never[]) => void) => void;
  off: (event: string, listener: (...args: never[]) => void) => void;
  emit: (event: string, payload: unknown) => void;
};

declare global {
  // eslint-disable-next-line no-var
  var __STORYBOOK_ADDONS_CHANNEL__: StorybookChannel | undefined;
}

// Runs in the browser via page.evaluate; resolves once Storybook's preview channel
// reports the story (including any play() interactions) has finished rendering.
const waitForStoryRendered = ({
  storyId,
  timeoutMs,
}: {
  storyId: string;
  timeoutMs: number;
}): Promise<StoryRenderResult> =>
  new Promise((resolve) => {
    const channel = globalThis.__STORYBOOK_ADDONS_CHANNEL__;

    if (!channel) {
      resolve({ ok: false, error: "Storybook channel (__STORYBOOK_ADDONS_CHANNEL__) not found" });
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      resolve({ ok: false, error: `Timed out waiting for story "${storyId}" to render` });
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeout);
      Object.entries(listeners).forEach(([event, listener]) => channel.off(event, listener));
    };

    const listeners: Record<string, (...args: never[]) => void> = {
      storyRendered: () => {
        cleanup();
        resolve({ ok: true });
      },
      storyUnchanged: () => {
        cleanup();
        resolve({ ok: true });
      },
      storyErrored: (payload?: { description?: string }) => {
        cleanup();
        resolve({ ok: false, error: payload?.description ?? "story errored" });
      },
      storyThrewException: (error?: { message?: string }) => {
        cleanup();
        resolve({ ok: false, error: error?.message ?? "story threw an exception" });
      },
      playFunctionThrewException: (error?: { message?: string }) => {
        cleanup();
        resolve({ ok: false, error: error?.message ?? "play function threw an exception" });
      },
      unhandledErrorsWhilePlaying: (errors?: { message?: string }[]) => {
        cleanup();
        resolve({ ok: false, error: errors?.[0]?.message ?? "unhandled error while playing" });
      },
      storyMissing: (id?: string) => {
        if (id !== storyId) {
          return;
        }
        cleanup();
        resolve({ ok: false, error: `story "${storyId}" was missing` });
      },
    };

    Object.entries(listeners).forEach(([event, listener]) => channel.on(event, listener));
    channel.emit("setCurrentStory", { storyId, viewMode: "story" });
  });

type CaptureStrategy = {
  waitForStoryRendered: (args: {
    storyId: string;
    timeoutMs: number;
  }) => Promise<StoryRenderResult>;
};

const channelBasedCaptureStrategy: CaptureStrategy = { waitForStoryRendered };

// Keyed off index.json's story-index version so a future Storybook preview API
// change can get its own `case` here; unrecognized versions fall through to default.
const getCaptureStrategy = (storyIndexVersion: number | undefined): CaptureStrategy => {
  switch (storyIndexVersion) {
    default:
      return channelBasedCaptureStrategy;
  }
};

const detectStoryIndexVersion = async (proxyOrigin: string): Promise<number | undefined> => {
  try {
    const response = await fetch(`${proxyOrigin}/index.json`);
    if (!response.ok) {
      return undefined;
    }
    const index = (await response.json()) as { v?: unknown };
    return typeof index.v === "number" ? index.v : undefined;
  } catch {
    return undefined;
  }
};

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
  let hasRenderError = false;
  let screenshot: Buffer;

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
      if (message.type() === "error") {
        hasRenderError = true;
      }
    });

    page.on("pageerror", (error) => {
      logs.push({ level: "error", message: error.message });
      hasRenderError = true;
    });

    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.origin === proxy.origin || url.protocol === "data:" || url.protocol === "blob:") {
        return route.continue();
      }
      return route.abort();
    });

    await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });
    await page.waitForSelector("#storybook-root, #root", {
      timeout: STORYBOOK_BOOT_TIMEOUT_MS,
      state: "attached",
    });

    const strategy = getCaptureStrategy(await detectStoryIndexVersion(proxy.origin));
    const renderResult = await page.evaluate(strategy.waitForStoryRendered, {
      storyId: snapshot.targetId,
      timeoutMs: STORY_RENDER_TIMEOUT_MS,
    });

    if (!renderResult.ok) {
      hasRenderError = true;
      logs.push({ level: "error", message: renderResult.error ?? "story failed to render" });
    }

    screenshot = await page.screenshot();
  } finally {
    await browser.close();
    proxy.close();
  }

  const imagePath = `builds/${build.id}/snapshots/${snapshotId}.png`;
  await storage.uploadFile(imagePath, screenshot, "image/png");

  if (logs.length > 0) {
    await dbClient.snapshotLogs.createMany({
      values: logs.map((log) => ({ snapshotId, level: log.level, message: log.message })),
    });
  }

  await dbClient.snapshots.updateCaptureResult(snapshotId, {
    status: "captured",
    imagePath,
    hasRenderError,
  });

  await enqueueDiffsIfAllCaptured(build.id);
};

export const enqueueDiffsIfAllCaptured = async (buildId: string): Promise<void> => {
  if (await dbClient.snapshots.hasAllCapturedForBuild(buildId)) {
    const snapshots = await dbClient.snapshots.findByBuild(buildId);
    await Promise.all(
      snapshots.map(async (s) => {
        const diff = await dbClient.diffs.create({ snapshotId: s.id });
        await enqueueDiff({ snapshotId: s.id, diffId: diff!.id });
      }),
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

  const baseline = await dbClient.baselines.find(
    project.id,
    snapshot.captureConfigurationId,
    snapshot.targetId,
  );

  if (!baseline) {
    await dbClient.diffs.updateStatus(diffId, "needs_review");
    await checkAllDoneAndFinalize(build.id);
    return;
  }

  if (!snapshot.imagePath) {
    throw new Error(`Snapshot has no captured image: ${snapshotId}`);
  }

  const baselineSnapshot = await dbClient.snapshots.findById(baseline.snapshotId);
  if (!baselineSnapshot?.imagePath) {
    throw new Error(`Baseline snapshot has no captured image: ${baseline.snapshotId}`);
  }

  const [capturePixels, baselinePixels] = await Promise.all([
    readPng(snapshot.imagePath),
    readPng(baselineSnapshot.imagePath),
  ]);

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

  if (diffPercent === 0 || diffPercent <= project.diffThreshold) {
    await dbClient.diffs.updateResult(diffId, {
      status: "auto_approved",
      pixelDiffCount,
      diffPercent,
    });
    await checkAllDoneAndFinalize(build.id);
    return;
  }

  const diffImagePath = `builds/${build.id}/diffs/${diffId}.png`;
  await storage.uploadFile(diffImagePath, encodePng(diffPixels, width, height), "image/png");

  await dbClient.diffs.updateResult(diffId, {
    status: "needs_review",
    diffImagePath,
    pixelDiffCount,
    diffPercent,
  });

  await checkAllDoneAndFinalize(build.id);
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
