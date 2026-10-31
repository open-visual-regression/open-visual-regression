import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  chromium,
  firefox,
  webkit,
  type BrowserType,
  type LaunchOptions,
  type Page,
} from "playwright";

import { SIGNAL_HANDLING_OPTIONS, newPage } from "@ovr/capture-browser/browser";
import type { CaptureStrategy } from "@ovr/capture-browser/captureStrategies";
import {
  blockExternalRequests,
  bootTargetPage,
  disableLazyLoading,
  getCaptureViewport,
  takeStableScreenshot,
  trackBlockedHosts,
  type BlockedHosts,
} from "@ovr/capture-browser/page";
import {
  settlePage,
  trackNetworkActivity,
  type NetworkActivity,
} from "@ovr/capture-browser/settle";
import { startStaticProxy } from "@ovr/capture-browser/staticProxy";
import { RENDER_TIMEOUT_MS, SETTLE_TIMEOUT_MS } from "@ovr/capture-browser/timeouts";

import { getDiffPercent } from "./compare";

const HASH_LENGTH = 12;

export type CaptureTarget = {
  targetId: string;
  browser: string;
  viewportName: string;
  viewportWidth: number;
  viewportHeight: number;
  waitForTimeout: number;
  diffThreshold: number;
  externalRequestAllowlist: string[] | null;
};

export type CapturedImage = {
  hash: string;
  count: number;
  diffPercent: number;
  file: string | null;
};

export type CaptureResult = {
  targetId: string;
  browser: string;
  viewportName: string;
  runs: number;
  diffThreshold: number;
  images: CapturedImage[];
  errors: string[];
  blockedHosts: string[];
};

export type CaptureRunOptions = {
  dir: string;
  strategy: CaptureStrategy;
  targets: CaptureTarget[];
  repeat: number;
  outDir?: string;
  cpuThrottle?: number;
  launchOptions: LaunchOptions;
};

type CaptureAttempt = {
  screenshot: Buffer;
  error: string | null;
};

const BROWSER_LAUNCHERS: Record<string, BrowserType> = { chromium, firefox, webkit };

const getBrowserLauncher = (browser: string): BrowserType => {
  const launcher = BROWSER_LAUNCHERS[browser];
  if (!launcher) {
    throw new Error(`Unsupported browser: ${browser}`);
  }
  return launcher;
};

const toFileName = (target: CaptureTarget, hash: string): string =>
  `${target.targetId}--${target.viewportName}--${hash}.png`.replace(/[^\w.-]+/g, "_");

const captureOnce = async (
  page: Page,
  strategy: CaptureStrategy,
  networkActivity: NetworkActivity,
  target: CaptureTarget,
): Promise<CaptureAttempt> => {
  const { fullPage, width, height } = getCaptureViewport(
    target.viewportWidth,
    target.viewportHeight,
  );

  await page.setViewportSize({ width, height });

  const renderResult = await page.evaluate(strategy.waitForTargetPlayed, {
    targetId: target.targetId,
    timeoutMs: RENDER_TIMEOUT_MS,
  });

  if (renderResult.ok) {
    await settlePage(page, networkActivity, SETTLE_TIMEOUT_MS);

    if (target.waitForTimeout > 0) {
      await page.waitForTimeout(target.waitForTimeout);
    }
  }

  return {
    // Matches the worker's default OVR_SCREENSHOT_STABILITY, so local captures match real builds.
    screenshot: (await takeStableScreenshot(page, fullPage, { mode: "auto" })).image,
    error: renderResult.ok ? null : (renderResult.error ?? "target failed to render"),
  };
};

const captureTarget = async (
  page: Page,
  origin: string,
  networkActivity: NetworkActivity,
  blockedHosts: BlockedHosts,
  target: CaptureTarget,
  { strategy, repeat, outDir }: CaptureRunOptions,
): Promise<CaptureResult> => {
  const images = new Map<string, CapturedImage>();
  const errors = new Set<string>();
  const blocked = new Set<string>();
  let reference: Buffer | null = null;

  for (let run = 0; run < repeat; run++) {
    // A fresh page per run, so no state carries over from the previous one.
    await bootTargetPage(page, origin, strategy);
    const { screenshot, error } = await captureOnce(page, strategy, networkActivity, target);
    for (const host of blockedHosts.take()) {
      blocked.add(host);
    }
    const hash = createHash("sha1").update(screenshot).digest("hex").slice(0, HASH_LENGTH);
    const image = images.get(hash);

    if (error) {
      errors.add(error);
    }

    if (image) {
      image.count += 1;
      continue;
    }

    reference ??= screenshot;
    const file = outDir ? path.join(outDir, toFileName(target, hash)) : null;
    if (file) {
      await writeFile(file, screenshot);
    }
    images.set(hash, { hash, count: 1, diffPercent: getDiffPercent(reference, screenshot), file });
  }

  return {
    targetId: target.targetId,
    browser: target.browser,
    viewportName: target.viewportName,
    runs: repeat,
    diffThreshold: target.diffThreshold,
    images: [...images.values()],
    errors: [...errors],
    blockedHosts: [...blocked].sort(),
  };
};

const captureWithBrowser = async (
  browserName: string,
  externalRequestAllowlist: string[] | null,
  targets: CaptureTarget[],
  origin: string,
  options: CaptureRunOptions,
): Promise<CaptureResult[]> => {
  const browser = await getBrowserLauncher(browserName).launch({
    ...SIGNAL_HANDLING_OPTIONS,
    ...options.launchOptions,
  });

  try {
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      ...blockExternalRequests(browser, origin, externalRequestAllowlist),
    });
    const page = await newPage(context);

    if (options.cpuThrottle) {
      if (browserName !== "chromium") {
        throw new Error("--cpu-throttle is only supported in Chromium.");
      }
      const session = await context.newCDPSession(page);
      await session.send("Emulation.setCPUThrottlingRate", { rate: options.cpuThrottle });
    }

    await disableLazyLoading(page);
    const networkActivity = trackNetworkActivity(page);
    const blockedHosts = trackBlockedHosts(page, origin, externalRequestAllowlist);

    try {
      const results: CaptureResult[] = [];
      for (const target of targets) {
        blockedHosts.take();
        results.push(
          await captureTarget(page, origin, networkActivity, blockedHosts, target, options),
        );
      }
      return results;
    } finally {
      networkActivity.dispose();
      blockedHosts.dispose();
    }
  } finally {
    await browser.close();
  }
};

type CapturePageTargets = {
  browser: string;
  externalRequestAllowlist: string[] | null;
  targets: CaptureTarget[];
};

export const runCaptures = async (options: CaptureRunOptions): Promise<CaptureResult[]> => {
  if (options.outDir) {
    await mkdir(options.outDir, { recursive: true });
  }

  const pages = new Map<string, CapturePageTargets>();
  for (const target of options.targets) {
    const { browser, externalRequestAllowlist } = target;
    const key = JSON.stringify([browser, externalRequestAllowlist]);
    const page = pages.get(key) ?? { browser, externalRequestAllowlist, targets: [] };
    pages.set(key, { ...page, targets: [...page.targets, target] });
  }

  const proxy = await startStaticProxy(options.dir);

  try {
    const results: CaptureResult[] = [];
    for (const { browser, externalRequestAllowlist, targets } of pages.values()) {
      results.push(
        ...(await captureWithBrowser(
          browser,
          externalRequestAllowlist,
          targets,
          proxy.origin,
          options,
        )),
      );
    }
    return results;
  } finally {
    proxy.close();
  }
};
