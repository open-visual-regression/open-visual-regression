import { existsSync } from "node:fs";
import path from "node:path";
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

const findConfigPath = (cwd: string): string | undefined =>
  CONFIG_FILENAMES.map((filename) => path.join(cwd, filename)).find((file) => existsSync(file));

export const loadViewports = async (cwd: string = process.cwd()): Promise<ResolvedViewport[]> => {
  const configPath = findConfigPath(cwd);

  if (!configPath) {
    return DEFAULT_VIEWPORTS;
  }

  const jiti = createJiti(import.meta.url);
  const loaded = await jiti.import<{ default: OvrConfig }>(configPath);
  const viewports = loaded.default?.viewports;
  const defaultViewports = loaded.default?.defaultViewports;

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
