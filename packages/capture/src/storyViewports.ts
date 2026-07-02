import type { Page } from "playwright";
import { chromium } from "playwright";

import {
  detectCaptureStrategy,
  readOvrStoryParameters,
  type CaptureStrategy,
} from "./captureStrategies";
import type { OvrStoryParameterViewport, OvrStoryParameters } from "./captureStrategies";
import { newPage } from "./lib/browser";
import { BOOT_TIMEOUT_MS, RENDER_TIMEOUT_MS } from "./lib/captureTimeouts";
import { startStaticProxy } from "./lib/staticProxy";

export type NamedViewport = {
  name?: string;
  browser: string;
  viewportWidth: number;
  viewportHeight?: number;
  default?: boolean;
};

type OverrideEntry = [targetId: string, parameters: OvrStoryParameters];

const readStoryOverride = async (
  page: Page,
  strategy: CaptureStrategy,
  targetId: string,
): Promise<OverrideEntry | undefined> => {
  try {
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
    return parameters ? [targetId, parameters] : undefined;
  } catch (error) {
    console.warn(
      `ovr: falling back to default viewports for "${targetId}" — error while reading its viewport override:`,
      error,
    );
    return undefined;
  }
};

export const readStoryParameterOverrides = async (
  bundleDir: string,
  targetIds: string[],
): Promise<Map<string, OvrStoryParameters>> => {
  const proxy = await startStaticProxy(bundleDir);
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext();
    const page = await newPage(context);

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

    const entries: OverrideEntry[] = [];
    for (const targetId of targetIds) {
      const entry = await readStoryOverride(page, strategy, targetId);
      if (entry) {
        entries.push(entry);
      }
    }

    return new Map(entries);
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

export const resolveTargetDiffThreshold = (
  buildDefault: number,
  override: OvrStoryParameters | undefined,
): number => override?.diffThreshold ?? buildDefault;
