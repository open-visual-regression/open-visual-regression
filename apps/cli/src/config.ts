import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createJiti } from "jiti";

import type { OvrConfig, Viewport as ConfigViewport } from "./defineConfig";

export const getApiKey = (): string => {
  const apiKey = process.env.OVR_API_KEY;

  if (!apiKey) {
    console.error("Error: OVR_API_KEY environment variable is required.");
    process.exit(1);
  }

  return apiKey;
};

export type ResolvedViewport = {
  name?: string;
  browser: "chromium" | "firefox" | "webkit";
  viewportWidth: number;
  viewportHeight?: number;
  default?: boolean;
};

const DEFAULT_VIEWPORTS: ResolvedViewport[] = [{ browser: "chromium", viewportWidth: 1280 }];

const CONFIG_FILENAMES = ["ovr.config.ts", "ovr.config.js", "ovr.config.mjs"];

const findConfigPath = (cwd: string, configPath?: string): string | undefined => {
  if (configPath) {
    const resolved = path.resolve(cwd, configPath);
    if (!existsSync(resolved)) {
      throw new Error(`ovr.config: config file not found at "${resolved}"`);
    }
    return resolved;
  }

  return CONFIG_FILENAMES.map((filename) => path.join(cwd, filename)).find((file) =>
    existsSync(file),
  );
};

export const loadOvrConfig = async (
  cwd: string,
  configPath?: string,
): Promise<OvrConfig | undefined> => {
  const resolvedConfigPath = findConfigPath(cwd, configPath);

  if (!resolvedConfigPath) {
    return undefined;
  }

  const jiti = createJiti(pathToFileURL(path.join(cwd, "/")).href);
  const loaded = await jiti.import<{ default: OvrConfig }>(resolvedConfigPath);
  return loaded.default;
};

export const DEFAULT_DIFF_THRESHOLD = 0.05;

export const resolveDiffThreshold = (config: OvrConfig | undefined): number => {
  const diffThreshold = config?.diffThreshold;

  if (diffThreshold === undefined) {
    return DEFAULT_DIFF_THRESHOLD;
  }

  if (diffThreshold <= 0 || diffThreshold > 1) {
    throw new Error(`ovr.config: "diffThreshold" must be greater than 0 and at most 1`);
  }

  return diffThreshold;
};

export const loadDiffThreshold = async (
  cwd: string = process.cwd(),
  configPath?: string,
): Promise<number> => resolveDiffThreshold(await loadOvrConfig(cwd, configPath));

export const resolveViewports = (config: OvrConfig | undefined): ResolvedViewport[] => {
  const viewports = config?.viewports;
  const defaultViewports = config?.defaultViewports;

  if (!viewports || viewports.length === 0) {
    return DEFAULT_VIEWPORTS;
  }

  if (defaultViewports) {
    const names = new Set(viewports.map((viewport) => viewport.name));
    const unknown = defaultViewports.filter((name) => !names.has(name));
    if (unknown.length > 0) {
      throw new Error(
        `ovr.config: "defaultViewports" references unknown viewport(s): ${unknown.join(", ")}`,
      );
    }
  }

  return viewports.map((viewport: ConfigViewport) => ({
    ...(viewport.name !== undefined && { name: viewport.name }),
    browser: viewport.browser ?? "chromium",
    viewportWidth: viewport.width,
    ...(viewport.height !== undefined && { viewportHeight: viewport.height }),
    ...(defaultViewports && {
      default: viewport.name !== undefined && defaultViewports.includes(viewport.name),
    }),
  }));
};

export const loadViewports = async (
  cwd: string = process.cwd(),
  configPath?: string,
): Promise<ResolvedViewport[]> => resolveViewports(await loadOvrConfig(cwd, configPath));
