import { chromium } from "playwright";

import type { OvrStoryParameterViewport, OvrStoryParameters } from "./captureStrategies";
import { newPage } from "./lib/browser";
import { BOOT_TIMEOUT_MS } from "./lib/captureTimeouts";
import { startStaticProxy } from "./lib/staticProxy";

export type NamedViewport = {
  name?: string;
  browser: string;
  viewportWidth: number;
  viewportHeight?: number;
  default?: boolean;
};

type OverrideReadResult = {
  entries: [string, OvrStoryParameters][];
  failures: [storyId: string, message: string][];
};

const readOvrOverrides = async (targetIds: string[]): Promise<OverrideReadResult> => {
  const preview = globalThis.__STORYBOOK_PREVIEW__;
  if (!preview) {
    return { entries: [], failures: [] };
  }

  await preview.storeInitializationPromise;

  const entries: [string, OvrStoryParameters][] = [];
  const failures: [string, string][] = [];
  for (const storyId of targetIds) {
    try {
      const story = await preview.loadStory({ storyId });
      const ovr = story?.parameters?.ovr as OvrStoryParameters | undefined;
      if (ovr) {
        entries.push([storyId, ovr]);
      }
    } catch (error) {
      failures.push([storyId, error instanceof Error ? error.message : String(error)]);
    }
  }

  return { entries, failures };
};

export type StoryParameterOverrides = {
  overrides: Map<string, OvrStoryParameters>;
  failures: Map<string, string>;
};

export const readStoryParameterOverrides = async (
  bundleDir: string,
  targetIds: string[],
): Promise<StoryParameterOverrides> => {
  const proxy = await startStaticProxy(bundleDir);
  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });

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

    await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });
    await page.waitForFunction(
      () => Boolean(globalThis.__STORYBOOK_PREVIEW__?.storeInitializationPromise),
      undefined,
      { timeout: BOOT_TIMEOUT_MS },
    );

    const { entries, failures } = await page.evaluate(readOvrOverrides, targetIds);
    return { overrides: new Map(entries), failures: new Map(failures) };
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
