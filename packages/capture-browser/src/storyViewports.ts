import { chromium, type LaunchOptions } from "playwright";

import {
  MAX_WAIT_FOR_TIMEOUT_MS,
  type OvrStoryParameterViewport,
  type OvrStoryParameters,
} from "@ovr/storybook-compat/parameters";

import { parseBlockExternalRequests, type ExternalRequestAllowlist } from "./allowedHosts";
import { launchBrowser, newPage, type ManagedBrowser } from "./browser";
import { blockExternalRequests } from "./page";
import { startStaticProxy } from "./staticProxy";
import { BOOT_TIMEOUT_MS } from "./timeouts";

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

type ViewportNameFields = Pick<NamedViewport, "name" | "viewportWidth" | "viewportHeight">;

export const toViewportName = (viewport: ViewportNameFields): string =>
  viewport.name ?? `${viewport.viewportWidth}x${viewport.viewportHeight || "auto"}`;

export const readStoryParameterOverrides = async (
  bundleDir: string,
  targetIds: string[],
  launchOptions: LaunchOptions = {},
  allowedHosts: ExternalRequestAllowlist = null,
): Promise<StoryParameterOverrides> => {
  const proxy = await startStaticProxy(bundleDir);
  let managed: ManagedBrowser;
  try {
    managed = await launchBrowser(chromium, {
      args: ["--disable-dev-shm-usage"],
      ...launchOptions,
    });
  } catch (error) {
    proxy.close();
    throw error;
  }
  const { browser } = managed;

  try {
    const context = await browser.newContext(
      blockExternalRequests(browser, proxy.origin, allowedHosts),
    );
    const page = await newPage(context);

    await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });
    await page.waitForFunction(
      () => Boolean(globalThis.__STORYBOOK_PREVIEW__?.storeInitializationPromise),
      undefined,
      { timeout: BOOT_TIMEOUT_MS },
    );

    const { entries, failures } = await page.evaluate(readOvrOverrides, targetIds);
    return { overrides: new Map(entries), failures: new Map(failures) };
  } finally {
    await managed.close();
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

// Unlike the other story parameters, an invalid value throws rather than falling back, since
// falling back could block hosts the story needs, or load ones it meant to block.
export const resolveTargetExternalRequestAllowlist = (
  buildDefault: ExternalRequestAllowlist,
  override: OvrStoryParameters | undefined,
): ExternalRequestAllowlist => {
  if (override?.blockExternalRequests === undefined) {
    return buildDefault;
  }
  try {
    return parseBlockExternalRequests(override.blockExternalRequests);
  } catch (error) {
    throw new Error(
      `parameters.ovr.blockExternalRequests: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};

// Story parameters aren't validated at upload, so a bad value falls back to the build
// default and an out-of-range one is clamped rather than failing the whole build.
export const resolveTargetWaitForTimeout = (
  buildDefault: number,
  override: OvrStoryParameters | undefined,
): number => {
  const waitForTimeout = override?.waitForTimeout;
  if (typeof waitForTimeout !== "number" || !Number.isFinite(waitForTimeout)) {
    return buildDefault;
  }
  return Math.min(Math.max(Math.round(waitForTimeout), 0), MAX_WAIT_FOR_TIMEOUT_MS);
};
