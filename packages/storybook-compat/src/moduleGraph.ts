import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import { JSONParser } from "@streamparser/json-node";

import { readViteImporters, type ViteStats } from "./viteStats";
import { readWebpackImporters, type WebpackStats } from "./webpackStats";

export const STATS_FILENAME = "preview-stats.json";

export type ModuleGraph =
  | {
      importers: Map<string, string[]>;
      packages: Set<string> | undefined;
    }
  | { reason: string };

type StatsModule = {
  name?: string | null;
  reasons?: { moduleName?: string | null }[];
  modules?: StatsModule[];
};

type Stats = { version?: string; modules: StatsModule[] };

const toGraphModule = ({ name, reasons, modules }: StatsModule): StatsModule => ({
  name,
  reasons: reasons?.map(({ moduleName }) => ({ moduleName })),
  modules: modules?.map(toGraphModule),
});

const readStats = async (file: string): Promise<Stats> => {
  const stats: Stats = { modules: [] };
  const parser = new JSONParser({ paths: ["$.version", "$.modules.*"], keepStack: false });
  parser.on("data", ({ key, value }) => {
    if (key === "version") {
      stats.version = value as string;
    } else {
      stats.modules.push(toGraphModule(value as StatsModule));
    }
  });

  await pipeline(createReadStream(file), parser);
  return stats;
};

// "node_modules/.pnpm/react@18.3.1/node_modules/react/index.js" is react.
const PACKAGE_PATH = /^.*node_modules\/((?:@[^/]+\/)?[^/]+)/;

const flatten = (modules: StatsModule[]): StatsModule[] =>
  modules.flatMap((module) => [module, ...flatten(module.modules ?? [])]);

export const readPackageNames = (names: string[]): Set<string> | undefined => {
  const packages = new Set<string>();
  for (const name of names) {
    for (const part of name.replaceAll("\\", "/").split("!")) {
      const packageName = PACKAGE_PATH.exec(part)?.[1];
      // Builders write generated modules, like Storybook's entries, to node_modules/.cache.
      if (packageName === undefined || packageName === ".cache") {
        continue;
      }
      if (packageName.startsWith(".")) {
        return undefined;
      }
      packages.add(packageName);
    }
  }
  return packages.size > 0 ? packages : undefined;
};

export const readModuleGraph = async (
  storybookDir: string,
  storyFiles: Set<string>,
): Promise<ModuleGraph | undefined> => {
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
  const packages = readPackageNames(
    flatten(stats.modules).flatMap(({ name }) => (name ? [name] : [])),
  );
  if (stats.version) {
    return { importers: readWebpackImporters(stats as WebpackStats, storyFiles), packages };
  }

  return { importers: readViteImporters(stats as ViteStats), packages };
};
