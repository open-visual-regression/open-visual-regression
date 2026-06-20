import type { Browser } from "playwright";
import { chromium } from "playwright";

import { detectCaptureStrategy, readOvrStoryParameters } from "./captureStrategies";
import { BOOT_TIMEOUT_MS, RENDER_TIMEOUT_MS } from "./lib/captureTimeouts";
import { startStaticProxy } from "./lib/staticProxy";
import type { StaticProxy } from "./lib/staticProxy";
import type { OvrStoryParameterViewport } from "./captureStrategies";

export type NamedViewport = {
  name?: string;
  browser: string;
  viewportWidth: number;
  viewportHeight?: number;
  default?: boolean;
};

type OverrideEntry = [targetId: string, viewports: OvrStoryParameterViewport[]];

const OVERRIDE_READ_CONCURRENCY = 8;

// Storybook reloads the preview iframe when switching between stories from
// different CSF files, which tears down any page state (including
// __STORYBOOK_ADDONS_CHANNEL__). Each target therefore gets its own fresh
// page, the same way the real capture step does.
const readOneStoryOverride = async (
  browser: Browser,
  proxy: StaticProxy,
  targetId: string,
): Promise<OverrideEntry | undefined> => {
  const context = await browser.newContext();

  try {
    const page = await context.newPage();

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
      targetId,
      timeoutMs: RENDER_TIMEOUT_MS,
    });

    if (!renderResult.ok) {
      console.warn(
        `ovr: falling back to default viewports for "${targetId}" — story failed to render while reading its viewport override (${renderResult.error ?? "unknown error"})`,
      );
      return undefined;
    }

    const parameters = await page.evaluate(readOvrStoryParameters, targetId);
    return parameters?.viewports ? [targetId, parameters.viewports] : undefined;
  } catch (error) {
    console.warn(
      `ovr: falling back to default viewports for "${targetId}" — error while reading its viewport override:`,
      error,
    );
    return undefined;
  } finally {
    await context.close();
  }
};

const readStoryOverrides = async (
  browser: Browser,
  proxy: StaticProxy,
  targetIds: readonly string[],
): Promise<OverrideEntry[]> => {
  const queue = [...targetIds];
  const entries: OverrideEntry[] = [];

  const worker = async (): Promise<void> => {
    for (let targetId = queue.shift(); targetId !== undefined; targetId = queue.shift()) {
      const entry = await readOneStoryOverride(browser, proxy, targetId);
      if (entry) {
        entries.push(entry);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(OVERRIDE_READ_CONCURRENCY, targetIds.length) }, worker),
  );

  return entries;
};

export const readStoryViewportOverrides = async (
  buildId: string,
  targetIds: string[],
): Promise<Map<string, OvrStoryParameterViewport[]>> => {
  const proxy = await startStaticProxy(buildId);
  const browser = await chromium.launch();

  try {
    return new Map(await readStoryOverrides(browser, proxy, targetIds));
  } finally {
    await browser.close();
    proxy.close();
  }
};

export const resolveTargetViewports = (
  catalog: NamedViewport[],
  override: OvrStoryParameterViewport[] | undefined,
): NamedViewport[] => {
  if (!override || override.length === 0) {
    return catalog.filter((viewport) => viewport.default !== false);
  }

  return override.map((entry) => {
    if (typeof entry === "string") {
      const match = catalog.find((viewport) => viewport.name === entry);
      if (!match) {
        throw new Error(`Unknown viewport "${entry}" referenced in story parameters`);
      }
      return match;
    }

    return {
      browser: entry.browser ?? "chromium",
      viewportWidth: entry.width,
      viewportHeight: entry.height,
    };
  });
};
