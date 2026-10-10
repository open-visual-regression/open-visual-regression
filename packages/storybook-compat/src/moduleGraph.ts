import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import { JSONParser } from "@streamparser/json-node";

import { readViteImporters, type ViteStats } from "./viteStats";
import { readWebpackImporters, type WebpackStats } from "./webpackStats";

export const STATS_FILENAME = "preview-stats.json";

export type ModuleGraph = { importers: Map<string, string[]> } | { reason: string };

type StatsModule = {
  name?: string | null;
  reasons?: { moduleName?: string | null }[];
  modules?: StatsModule[];
};

type Stats = { version?: string; rspackVersion?: string; modules: StatsModule[] };

const toGraphModule = ({ name, reasons, modules }: StatsModule): StatsModule => ({
  name,
  reasons: reasons?.map(({ moduleName }) => ({ moduleName })),
  modules: modules?.map(toGraphModule),
});

const readStats = async (file: string): Promise<Stats> => {
  const stats: Stats = { modules: [] };
  const parser = new JSONParser({
    paths: ["$.version", "$.rspackVersion", "$.modules.*"],
    keepStack: false,
  });
  parser.on("data", ({ key, value }) => {
    if (key === "version") {
      stats.version = value as string;
    } else if (key === "rspackVersion") {
      stats.rspackVersion = value as string;
    } else {
      stats.modules.push(toGraphModule(value as StatsModule));
    }
  });

  await pipeline(createReadStream(file), parser);
  return stats;
};

export const readModuleGraph = async (storybookDir: string): Promise<ModuleGraph | undefined> => {
  const file = path.join(storybookDir, STATS_FILENAME);
  if (!existsSync(file)) {
    return undefined;
  }

  let stats: Stats;
  try {
    stats = await readStats(file);
  } catch (error) {
    return {
      reason: `could not parse ${STATS_FILENAME} (${error instanceof Error ? error.message : String(error)})`,
    };
  }

  if (stats.modules.length === 0) {
    return undefined;
  }
  if (stats.rspackVersion) {
    return {
      reason: `${STATS_FILENAME} was written by Rspack; only Vite and Webpack builds are traced`,
    };
  }
  if (stats.version) {
    return { importers: readWebpackImporters(stats as WebpackStats) };
  }

  return { importers: readViteImporters(stats as ViteStats) };
};
