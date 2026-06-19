import { chromium } from "playwright";

import { detectCaptureStrategy, readOvrStoryParameters } from "./captureStrategies";
import { startStaticProxy } from "./lib/staticProxy";
import type { OvrStoryParameterViewport } from "./captureStrategies";

export type NamedViewport = {
  name?: string;
  browser: string;
  viewportWidth: number;
  viewportHeight?: number;
  default?: boolean;
};

const PARAM_BOOT_TIMEOUT_MS = 3_000;
const PARAM_RENDER_TIMEOUT_MS = 5_000;

export const readStoryViewportOverrides = async (
  buildId: string,
  targetIds: string[],
): Promise<Map<string, OvrStoryParameterViewport[] | undefined>> => {
  const overrides = new Map<string, OvrStoryParameterViewport[] | undefined>();

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
      return overrides;
    }

    for (const targetId of targetIds) {
      try {
        const renderResult = await page.evaluate(strategy.waitForTargetRendered, {
          targetId,
          timeoutMs: PARAM_RENDER_TIMEOUT_MS,
        });

        if (!renderResult.ok) {
          continue;
        }

        const parameters = await page.evaluate(readOvrStoryParameters, targetId);
        if (parameters?.viewports) {
          overrides.set(targetId, parameters.viewports);
        }
      } catch {
        continue;
      }
    }
  } finally {
    await browser.close();
    proxy.close();
  }

  return overrides;
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
