import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  diffPackageJson,
  findChangedLockedPackages,
  isBuildTooling,
  packageNameOf,
} from "./dependencies";
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
  /**
   * Reads a file as it was at the base commit, or undefined if it did not exist. Without it,
   * any lockfile or manifest change captures every story.
   */
  readBaseFile?: (file: string) => Promise<string | undefined>;
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
const PACKAGE_JSON = /(^|\/)package\.json$/;
// Every ovr.config is read by the CLI, never bundled. The CLI checks its own for capture changes.
const NON_RENDERING = /\.md$|(^|\/)\.(github|changeset)\/|(^|\/)ovr\.config\.[cm]?[jt]s$/;
const MAX_LISTED_PACKAGES = 5;

const listPackages = (names: string[]): string =>
  names.length > MAX_LISTED_PACKAGES
    ? `${names.slice(0, MAX_LISTED_PACKAGES).join(", ")} and ${names.length - MAX_LISTED_PACKAGES} more`
    : names.join(", ");

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
  // npm packages with modules in the bundle, by the name they are installed under.
  const bundledDependencies = new Set(
    [...graph.importers].flatMap(([name, parents]) =>
      [name, ...parents].flatMap((file) => packageNameOf(file) ?? []),
    ),
  );
  const describeRendering = (names: string[]): string | undefined => {
    const bundled = names.filter((name) => bundledDependencies.has(name));
    const tooling = names.filter((name) => !bundledDependencies.has(name) && isBuildTooling(name));
    const parts = [
      bundled.length > 0 && `${listPackages(bundled)} (bundled by the Storybook)`,
      tooling.length > 0 && `${listPackages(tooling)} (builds the Storybook)`,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join("; ") : undefined;
  };

  const readHeadFile = async (file: string): Promise<string | undefined> => {
    try {
      return await readFile(path.join(repoRoot, file), "utf-8");
    } catch {
      return undefined;
    }
  };
  const readVersions = async (file: string) => {
    const [base, head] = await Promise.all([readBaseFile?.(file), readHeadFile(file)]);
    return base === undefined || head === undefined ? undefined : { base, head };
  };

  // Why a lockfile change can change what renders, or undefined if it cannot.
  const checkLockfile = async (file: string): Promise<string | undefined> => {
    const versions = await readVersions(file);
    const changed = versions && findChangedLockedPackages(file, versions.base, versions.head);
    if (!changed) {
      return `dependencies changed (${file})`;
    }
    const rendering = describeRendering(changed);
    return rendering && `dependencies changed (${file}): ${rendering}`;
  };

  const checkPackageJson = async (file: string): Promise<string | undefined> => {
    const versions = await readVersions(file);
    const change = versions && diffPackageJson(versions.base, versions.head);
    if (!change) {
      return `${file} is not traceable but is in a package the Storybook bundles`;
    }
    if (change.kind === "fields") {
      return `${file} changed ${change.fields.map((field) => `"${field}"`).join(", ")}, which can change how the Storybook is built`;
    }
    const rendering = describeRendering(change.names);
    return rendering && `${file} changed the version range of ${rendering}`;
  };

  const storybookConfigDir = path.relative(repoRoot, path.join(projectDir, ".storybook"));
  const matches = (file: string, globs: string[]) =>
    globs.some((glob) => path.matchesGlob(file, glob));

  const seeds: string[] = [];
  const ignoredFiles: string[] = [];

  for (const file of changedFiles) {
    const isRootFile = !file.includes("/");
    const inBundledPackage = bundledPackages.has(packageDirOf(file));

    if (matches(file, untraced)) {
      ignoredFiles.push(file);
    } else if (matches(file, externals)) {
      return all(`${file} matches "externals"`);
    } else if (importers.has(file)) {
      seeds.push(file);
    } else if (file.startsWith(`${storybookConfigDir}/`)) {
      return all(`${file} is Storybook configuration`);
    } else if (NON_RENDERING.test(file)) {
      ignoredFiles.push(file);
    } else if (LOCKFILE.test(file) && (isRootFile || inBundledPackage)) {
      const reason = await checkLockfile(file);
      if (reason) {
        return all(reason);
      }
      ignoredFiles.push(file);
    } else if (PACKAGE_JSON.test(file) && (isRootFile || inBundledPackage)) {
      const reason = await checkPackageJson(file);
      if (reason) {
        return all(reason);
      }
      ignoredFiles.push(file);
    } else if (CONFIG_FILE.test(file) && (isRootFile || inBundledPackage)) {
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
