import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { findChangedPackages, readLockfileVersions } from "./lockfiles";
import { readModuleGraph, STATS_FILENAME } from "./moduleGraph";

type IndexEntry = { id: string; importPath: string; type?: string };

export type AffectedStoriesInput = {
  storybookDir: string;
  /** Where `storybook build` ran; the stats' paths are relative to it. */
  projectDir: string;
  repoRoot: string;
  changedFiles: string[];
  externals?: string[];
  untraced?: string[];
  /** Undefined when the file didn't exist at the base commit. */
  readBaseFile?: (file: string) => Promise<string | undefined>;
  ovrConfig?: { file: string; changedCaptureSettings: () => Promise<string | null> };
  buildDependencies?: string[];
};

export type AffectedStoryFile = {
  file: string;
  storyIds: string[];
  via: string[];
};

export type AffectedStories =
  | { mode: "all"; reason: string }
  | {
      mode: "some";
      storyIds: string[];
      storyFiles: AffectedStoryFile[];
      ignoredFiles: string[];
    };

const CODE_FILE = /\.[cm]?[jt]sx?$/;
const LOCKFILE =
  /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/;
const CONFIG_FILE = /(^|\/)([^/]+\.config\.[cm]?[jt]s|tsconfig[^/]*\.json)$/;
const NON_RENDERING = /\.md$|(^|\/)\.(github|changeset)\//;

const BUNDLED_MANIFEST_FIELDS = [
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
  "exports",
  "main",
  "module",
  "browser",
  "imports",
  "sideEffects",
] as const;

// Shape every story's output without appearing in the module graph.
const BUILD_TOOLS = [
  "storybook",
  "storybook-*",
  "@storybook/*",
  "vite",
  "@vitejs/*",
  "vite-plugin-*",
  "webpack",
  "webpack-*",
  "*-webpack-plugin",
  "rollup-plugin-*",
  "@rspack/*",
  "esbuild",
  "rollup",
  "@rollup/*",
  "@swc/*",
  "@babel/*",
  "babel-*",
  "typescript",
  "postcss",
  "postcss-*",
  "autoprefixer",
  "tailwindcss",
  "@tailwindcss/*",
  "sass",
  "sass-embedded",
  "less",
  "lightningcss",
  "@vanilla-extract/*",
  "@pandacss/*",
  "*-loader",
];

const stableStringify = (value: unknown): string =>
  JSON.stringify(value, (_key, nested: unknown) =>
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? Object.fromEntries(Object.entries(nested).sort(([a], [b]) => a.localeCompare(b)))
      : nested,
  ) ?? "undefined";

const readText = async (file: string): Promise<string | undefined> => {
  try {
    return await readFile(file, "utf-8");
  } catch {
    return undefined;
  }
};

const parseManifest = (contents: string | undefined): Record<string, unknown> | undefined => {
  try {
    return contents === undefined ? undefined : (JSON.parse(contents) as Record<string, unknown>);
  } catch {
    return undefined;
  }
};

const readJson = async <T>(file: string): Promise<T | undefined> => {
  try {
    return JSON.parse(await readFile(file, "utf-8")) as T;
  } catch {
    return undefined;
  }
};

export const findAffectedStories = async ({
  storybookDir,
  projectDir,
  repoRoot,
  changedFiles,
  externals = [],
  untraced = [],
  readBaseFile,
  ovrConfig,
  buildDependencies = [],
}: AffectedStoriesInput): Promise<AffectedStories> => {
  const all = (reason: string): AffectedStories => ({ mode: "all", reason });

  const index = await readJson<{ entries?: Record<string, IndexEntry> }>(
    path.join(storybookDir, "index.json"),
  );
  const graph = await readModuleGraph(
    storybookDir,
    new Set(Object.values(index?.entries ?? {}).map((entry) => entry.importPath)),
  );
  if (!graph || !index?.entries) {
    return all(`${STATS_FILENAME} or index.json is missing; build Storybook with --stats-json`);
  }
  if ("reason" in graph) {
    return all(graph.reason);
  }

  const toRepoPath = (name: string): string =>
    name.startsWith(".")
      ? path.relative(repoRoot, path.resolve(projectDir, name)).split(path.sep).join("/")
      : name;

  const importers = new Map(
    [...graph.importers].map(([name, parents]) => [toRepoPath(name), parents.map(toRepoPath)]),
  );

  const storiesByFile = new Map<string, string[]>();
  for (const entry of Object.values(index.entries)) {
    const file = toRepoPath(entry.importPath);
    const stories = storiesByFile.get(file) ?? [];
    storiesByFile.set(file, entry.type === "docs" ? stories : [...stories, entry.id]);
  }

  const storyFiles = [...storiesByFile.keys()];
  if (storyFiles.some((file) => !existsSync(path.join(repoRoot, file)))) {
    return all(`this build's story files are not under ${projectDir}; run from where it was built`);
  }
  if (storyFiles.some((file) => !importers.has(file))) {
    return all(`${STATS_FILENAME} does not match index.json; rebuild with --stats-json`);
  }

  const packageDirOf = (file: string): string => {
    let dir = path.posix.dirname(file);
    while (dir !== "." && !existsSync(path.join(repoRoot, dir, "package.json"))) {
      dir = path.posix.dirname(dir);
    }
    return dir;
  };

  const bundledPackages = new Set(
    [...importers.keys()]
      .filter((file) => !file.startsWith("/") && !file.includes("node_modules/"))
      .map(packageDirOf),
  );
  const storybookConfigDir = path.relative(repoRoot, path.join(projectDir, ".storybook"));
  const matches = (file: string, globs: string[]) =>
    globs.some((glob) => path.matchesGlob(file, glob));

  const bundledDependencies = new Set(
    [...importers.keys()].flatMap((file) =>
      [...file.matchAll(/node_modules\/((?:@[^/]+\/)?[^/]+)\//g)].map((match) => match[1]!),
    ),
  );

  const manifestChange = async (file: string): Promise<string | null> => {
    const base = parseManifest(await readBaseFile!(file));
    const current = parseManifest(await readText(path.join(repoRoot, file)));
    if (!base || !current) {
      return `${file} is not traceable but is in a package the Storybook bundles`;
    }
    const field = BUNDLED_MANIFEST_FIELDS.find(
      (name) => stableStringify(base[name]) !== stableStringify(current[name]),
    );
    return field ? `${file} changed "${field}"` : null;
  };

  const lockfileChange = async (file: string): Promise<string | null> => {
    const base = readLockfileVersions(file, (await readBaseFile!(file)) ?? "");
    const current = readLockfileVersions(file, (await readText(path.join(repoRoot, file))) ?? "");
    if (!base || !current) {
      return `dependencies changed (${file})`;
    }
    for (const name of findChangedPackages(base, current)) {
      if (bundledDependencies.has(name)) {
        return `dependencies changed (${file}: ${name} is bundled into the Storybook)`;
      }
      if (matches(name, [...BUILD_TOOLS, ...buildDependencies])) {
        return `dependencies changed (${file}: ${name} builds the Storybook)`;
      }
    }
    return null;
  };

  const seeds: string[] = [];
  const ignoredFiles: string[] = [];

  for (const file of changedFiles) {
    const isRootFile = !file.includes("/");
    const inBundledPackage = bundledPackages.has(packageDirOf(file));

    const isBundledScope = isRootFile || inBundledPackage;

    if (matches(file, untraced)) {
      ignoredFiles.push(file);
    } else if (matches(file, externals)) {
      return all(`${file} matches "externals"`);
    } else if (ovrConfig && file === ovrConfig.file) {
      const reason = await ovrConfig.changedCaptureSettings();
      if (reason) {
        return all(reason);
      }
      ignoredFiles.push(file);
    } else if (importers.has(file)) {
      seeds.push(file);
    } else if (file.startsWith(`${storybookConfigDir}/`)) {
      return all(`${file} is Storybook configuration`);
    } else if (NON_RENDERING.test(file)) {
      ignoredFiles.push(file);
    } else if (LOCKFILE.test(file) && isBundledScope) {
      const reason = readBaseFile ? await lockfileChange(file) : `dependencies changed (${file})`;
      if (reason) {
        return all(reason);
      }
      ignoredFiles.push(file);
    } else if (path.posix.basename(file) === "package.json" && isBundledScope && readBaseFile) {
      const reason = await manifestChange(file);
      if (reason) {
        return all(reason);
      }
      ignoredFiles.push(file);
    } else if (CONFIG_FILE.test(file) && isBundledScope) {
      return all(`build configuration changed (${file})`);
    } else if (CODE_FILE.test(file)) {
      ignoredFiles.push(file);
    } else if (inBundledPackage) {
      return all(`${file} is not traceable but is in a package the Storybook bundles`);
    } else {
      ignoredFiles.push(file);
    }
  }

  const reachedFrom = new Map<string, string | null>(seeds.map((seed) => [seed, null]));
  const chainTo = (file: string): string[] => {
    const chain: string[] = [];
    for (let node: string | null | undefined = file; node; node = reachedFrom.get(node)) {
      chain.unshift(node);
    }
    return chain;
  };

  const reachedStoryFiles: string[] = [];
  const queue = [...seeds];

  while (queue.length > 0) {
    const node = queue.shift()!;
    const isStoryFile = storiesByFile.has(node);
    const parents = importers.get(node) ?? [];

    if (isStoryFile) {
      reachedStoryFiles.push(node);
    } else if (parents.length === 0) {
      return all(`${chainTo(node).join(" <- ")} is an entry of the Storybook preview`);
    }

    for (const parent of parents) {
      // Only stories that import other stories continue past a story file.
      if (isStoryFile && !storiesByFile.has(parent)) {
        continue;
      }

      if (!importers.has(parent)) {
        return all(`${chainTo(node).join(" <- ")} is loaded by ${parent}`);
      }

      if (!reachedFrom.has(parent)) {
        reachedFrom.set(parent, node);
        queue.push(parent);
      }
    }
  }

  const affectedStoryFiles = reachedStoryFiles
    .map((file) => ({ file, storyIds: storiesByFile.get(file)!, via: chainTo(file) }))
    .filter((storyFile) => storyFile.storyIds.length > 0);

  return {
    mode: "some",
    storyIds: affectedStoryFiles.flatMap((storyFile) => storyFile.storyIds),
    storyFiles: affectedStoryFiles,
    ignoredFiles,
  };
};
