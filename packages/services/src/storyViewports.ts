import type { Page } from "playwright";
import { chromium } from "playwright";

import { detectCaptureStrategy, readOvrStoryParameters } from "./captureStrategies";
import { startStaticProxy } from "./lib/staticProxy";
import type { CaptureStrategy, OvrStoryParameterViewport } from "./captureStrategies";

export type NamedViewport = {
  name?: string;
  browser: string;
  viewportWidth: number;
  viewportHeight?: number;
  default?: boolean;
};

const PARAM_BOOT_TIMEOUT_MS = 3_000;
const PARAM_RENDER_TIMEOUT_MS = 5_000;

type OverrideEntry = [targetId: string, viewports: OvrStoryParameterViewport[]];

const readOneStoryOverride = async (
  page: Page,
  strategy: CaptureStrategy,
  targetId: string,
): Promise<OverrideEntry | undefined> => {
  try {
    const renderResult = await page.evaluate(strategy.waitForTargetRendered, {
      targetId,
      timeoutMs: PARAM_RENDER_TIMEOUT_MS,
    });

    if (!renderResult.ok) {
      return undefined;
    }

    const parameters = await page.evaluate(readOvrStoryParameters, targetId);
    return parameters?.viewports ? [targetId, parameters.viewports] : undefined;
  } catch {
    return undefined;
  }
};

const readStoryOverrides = async (
  page: Page,
  strategy: CaptureStrategy,
  targetIds: readonly string[],
): Promise<OverrideEntry[]> => {
  if (targetIds.length === 0) {
    return [];
  }

  const [targetId, ...rest] = targetIds;
  const entry = await readOneStoryOverride(page, strategy, targetId!);
  const remaining = await readStoryOverrides(page, strategy, rest);

  return entry ? [entry, ...remaining] : remaining;
};

export const readStoryViewportOverrides = async (
  buildId: string,
  targetIds: string[],
): Promise<Map<string, OvrStoryParameterViewport[]>> => {
  const proxy = await startStaticProxy(buildId);
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext();
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

    try {
      await strategy.waitForBoot(page, PARAM_BOOT_TIMEOUT_MS);
    } catch {
      return new Map();
    }

    return new Map(await readStoryOverrides(page, strategy, targetIds));
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
