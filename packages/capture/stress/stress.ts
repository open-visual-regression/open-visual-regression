// Stress test for the capture hot path on one worker node. Runs CONCURRENCY capture-group jobs at a
// time, each launching its own browser and capturing GROUP_SIZE snapshots on one warm page, like
// the worker's capture jobs do. Uses OVR's real launch, boot, render, settle and screenshot code;
// upload and DB writes are left out because a stability check doesn't change them.
//
//   (cd packages/capture/stress/storybook && pnpm install && pnpm exec storybook build)
//   CONCURRENCY=4 SNAPSHOTS=600 MODE=off apps/worker/node_modules/.bin/tsx packages/capture/stress/stress.ts
//
// MODE is "off" (today's single screenshot) or a stability mode exported by
// @ovr/capture-browser/page. Writes a JSON summary to stress/results/.

import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Page } from "playwright";

import { launchBrowser, newPage } from "@ovr/capture-browser/browser";
import { detectCaptureStrategy } from "@ovr/capture-browser/captureStrategies";
import * as capturePage from "@ovr/capture-browser/page";
import { settlePage, trackNetworkActivity } from "@ovr/capture-browser/settle";
import { startStaticProxy } from "@ovr/capture-browser/staticProxy";
import { RENDER_TIMEOUT_MS, SETTLE_TIMEOUT_MS } from "@ovr/capture-browser/timeouts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUNDLE_DIR = path.join(HERE, "storybook/storybook-static");

const env = (name: string, fallback: number) => Number(process.env[name] ?? fallback);
const CONCURRENCY = env("CONCURRENCY", 4);
const SNAPSHOTS = env("SNAPSHOTS", 600);
const GROUP_SIZE = env("GROUP_SIZE", 10);
const MODE = process.env.MODE ?? "off";
const LABEL = process.env.LABEL ?? MODE;

type Viewport = { name: string; width: number; height: number; fullPage: boolean };
const DESKTOP: Viewport = { name: "desktop", width: 1280, height: 800, fullPage: false };
const MOBILE: Viewport = { name: "mobile", width: 375, height: 667, fullPage: false };
const FULL_PAGE: Viewport = { name: "desktop-full", width: 1280, height: 800, fullPage: true };
// Stories long enough that a team would capture them full page.
const FULL_PAGE_STORIES = /table-150|article-long|cards-24|form-large/;

type SnapshotSpec = { storyId: string; viewport: Viewport };

type ScreenshotResult = { image: Buffer; screenshots: number; stable: boolean };

const screenshot = async (page: Page, fullPage: boolean): Promise<ScreenshotResult> => {
  if (MODE === "off") {
    return {
      image: await capturePage.takeScreenshot(page, fullPage),
      screenshots: 1,
      stable: true,
    };
  }
  const takeStable = (capturePage as Record<string, unknown>).takeStableScreenshot as
    | ((page: Page, fullPage: boolean, options: { mode: string }) => Promise<ScreenshotResult>)
    | undefined;
  if (!takeStable) {
    throw new Error(`MODE=${MODE} needs takeStableScreenshot in @ovr/capture-browser/page`);
  }
  return takeStable(page, fullPage, { mode: MODE });
};

type Sample = {
  key: string;
  totalMs: number;
  renderMs: number;
  settleMs: number;
  screenshotMs: number;
  screenshots: number;
  stable: boolean;
  hash: string;
  fullPage: boolean;
};

const now = () => performance.now();

const loadSpecs = async (): Promise<SnapshotSpec[]> => {
  const index = JSON.parse(await readFile(path.join(BUNDLE_DIR, "index.json"), "utf8")) as {
    entries: Record<string, { id: string; type: string }>;
  };
  const stories = Object.values(index.entries).filter((entry) => entry.type === "story");
  const unique: SnapshotSpec[] = stories.flatMap(({ id }) => [
    { storyId: id, viewport: DESKTOP },
    { storyId: id, viewport: MOBILE },
    ...(FULL_PAGE_STORIES.test(id) ? [{ storyId: id, viewport: FULL_PAGE }] : []),
  ]);

  // Repeat the set and interleave deterministically, so every group mixes stories.
  const specs = Array.from({ length: SNAPSHOTS }, (_, i) => unique[(i * 7) % unique.length]!);
  return specs;
};

const runGroup = async (
  group: SnapshotSpec[],
  origin: string,
  strategy: Awaited<ReturnType<typeof detectCaptureStrategy>>,
): Promise<{ samples: Sample[]; bootMs: number }> => {
  const bootStart = now();
  const managed = await launchBrowser(chromium, {
    args: ["--disable-dev-shm-usage"],
    executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
  });
  const samples: Sample[] = [];
  try {
    const context = await managed.browser.newContext({ deviceScaleFactor: 1 });
    const page = await newPage(context);
    await capturePage.disableLazyLoading(page);
    await capturePage.bootTargetPage(page, origin, strategy);
    const activity = trackNetworkActivity(page);
    const bootMs = now() - bootStart;

    for (const { storyId, viewport } of group) {
      const start = now();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const renderStart = now();
      const rendered = await page.evaluate(strategy.waitForTargetPlayed, {
        targetId: storyId,
        timeoutMs: RENDER_TIMEOUT_MS,
      });
      if (!rendered.ok) {
        throw new Error(`${storyId} failed to render: ${rendered.error}`);
      }
      const settleStart = now();
      await settlePage(page, activity, SETTLE_TIMEOUT_MS);
      const shotStart = now();
      const shot = await screenshot(page, viewport.fullPage);
      const end = now();

      samples.push({
        key: `${storyId}@${viewport.name}`,
        totalMs: end - start,
        renderMs: settleStart - renderStart,
        settleMs: shotStart - settleStart,
        screenshotMs: end - shotStart,
        screenshots: shot.screenshots,
        stable: shot.stable,
        // The worker hashes every capture too, so this cost is the same in every mode.
        hash: createHash("sha256").update(shot.image).digest("hex"),
        fullPage: viewport.fullPage,
      });
    }
    activity.dispose();
    return { samples, bootMs };
  } finally {
    await managed.close();
  }
};

const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;
};
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / (values.length || 1);
const round = (value: number) => Math.round(value * 10) / 10;

const main = async () => {
  const specs = await loadSpecs();
  const groups = Array.from({ length: Math.ceil(specs.length / GROUP_SIZE) }, (_, i) =>
    specs.slice(i * GROUP_SIZE, (i + 1) * GROUP_SIZE),
  );
  const strategy = await detectCaptureStrategy(BUNDLE_DIR);

  const samples: Sample[] = [];
  const bootMs: number[] = [];
  let next = 0;
  const wallStart = now();

  // Each group gets its own static server, like the worker's capture jobs.
  const worker = async () => {
    while (next < groups.length) {
      const group = groups[next++]!;
      const proxy = await startStaticProxy(BUNDLE_DIR);
      try {
        const result = await runGroup(group, proxy.origin, strategy);
        samples.push(...result.samples);
        bootMs.push(result.bootMs);
      } finally {
        proxy.close();
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const wallMs = now() - wallStart;

  // Outputs that differed between captures of the same story and viewport.
  const hashesByKey = new Map<string, Set<string>>();
  for (const sample of samples) {
    const hashes = hashesByKey.get(sample.key) ?? new Set();
    hashes.add(sample.hash);
    hashesByKey.set(sample.key, hashes);
  }
  const nondeterministic = [...hashesByKey.entries()]
    .filter(([, hashes]) => hashes.size > 1)
    .map(([key, hashes]) => `${key} (${hashes.size} looks)`);

  const totals = samples.map((s) => s.totalMs);
  const summary = {
    label: LABEL,
    mode: MODE,
    concurrency: CONCURRENCY,
    cpus: os.cpus().length,
    snapshots: samples.length,
    wallSeconds: round(wallMs / 1000),
    snapshotsPerHour: Math.round((samples.length / wallMs) * 3_600_000),
    perSnapshotMs: {
      p50: round(percentile(totals, 50)),
      p95: round(percentile(totals, 95)),
      p99: round(percentile(totals, 99)),
      mean: round(mean(totals)),
    },
    phaseMeanMs: {
      render: round(mean(samples.map((s) => s.renderMs))),
      settle: round(mean(samples.map((s) => s.settleMs))),
      screenshot: round(mean(samples.map((s) => s.screenshotMs))),
      screenshotFullPage: round(mean(samples.filter((s) => s.fullPage).map((s) => s.screenshotMs))),
      screenshotViewport: round(
        mean(samples.filter((s) => !s.fullPage).map((s) => s.screenshotMs)),
      ),
      boot: round(mean(bootMs)),
    },
    screenshotsPerSnapshot: round(mean(samples.map((s) => s.screenshots)) * 100) / 100,
    unstableSnapshots: samples.filter((s) => !s.stable).length,
    nondeterministicOutputs: nondeterministic,
    // Stories that took more than one screenshot, with their mean screenshots and total time.
    checkedStories: Object.fromEntries(
      [...new Set(samples.filter((s) => s.screenshots > 1).map((s) => s.key))].sort().map((key) => {
        const ofKey = samples.filter((s) => s.key === key);
        return [
          key,
          `${round(mean(ofKey.map((s) => s.screenshots)))} shots, ${Math.round(mean(ofKey.map((s) => s.totalMs)))}ms`,
        ];
      }),
    ),
  };

  console.log(JSON.stringify(summary, null, 2));
  await mkdir(path.join(HERE, "results"), { recursive: true });
  await writeFile(
    path.join(HERE, "results", `${LABEL}-c${CONCURRENCY}-${Date.now()}.json`),
    JSON.stringify(summary, null, 2),
  );
};

await main();
