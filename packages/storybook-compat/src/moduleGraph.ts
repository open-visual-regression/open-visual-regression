import { readFile } from "node:fs/promises";
import path from "node:path";

import { readViteImporters, type ViteStats } from "./viteStats";

export const STATS_FILENAME = "preview-stats.json";

export type ModuleGraph = { importers: Map<string, string[]> } | { reason: string };

type Stats = { version?: string; modules?: unknown[] };

export const readModuleGraph = async (storybookDir: string): Promise<ModuleGraph | undefined> => {
  let stats: Stats | undefined;
  try {
    stats = JSON.parse(await readFile(path.join(storybookDir, STATS_FILENAME), "utf-8")) as Stats;
  } catch {
    return undefined;
  }

  if (!stats?.modules) {
    return undefined;
  }
  if (stats.version) {
    return {
      reason: `${STATS_FILENAME} was written by Webpack or Rspack; only Vite builds are traced`,
    };
  }

  return { importers: readViteImporters(stats as ViteStats) };
};
