import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { diffLockfile, isSupportedLockfile } from "./lockfile";
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
  readBaseFile?: (file: string) => Promise<string | undefined>;
};

export type UnbundledDependencies = {
  lockfile: string;
  packages: string[];
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
      unbundledDependencies: UnbundledDependencies[];
    };

const CODE_FILE = /\.[cm]?[jt]sx?$/;
// Stylesheets are loaded through imports like code, so one outside the graph cannot render.
const STYLE_FILE = /\.(css|scss|sass|less|styl|pcss)$/;
const LOCKFILE =
  /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/;
const CONFIG_FILE = /(^|\/)([^/]+\.config\.[cm]?[jt]s|tsconfig[^/]*\.json)$/;
const NON_RENDERING = /\.md$|(^|\/)\.(github|changeset)\//;
// Packages that change the build's output without being in it.
const BUILD_TOOL =
  /^(.*storybook.*|vite|@vitejs\/.+|vite-plugin-.+|rollup|@rollup\/.+|rolldown|@rolldown\/.+|webpack(-.+)?|.+-loader|@rspack\/.+|@rsbuild\/.+|@swc\/.+|esbuild|@esbuild\/.+|@babel\/.+|babel-.+|postcss(-.+)?|autoprefixer|tailwindcss|@tailwindcss\/.+|sass(-embedded)?|less|lightningcss(-.+)?)$/;
const MAX_LISTED_PACKAGES = 5;

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
  const storybookConfigDir = path.relative(repoRoot, path.join(projectDir, ".storybook"));
  const matches = (file: string, globs: string[]) =>
    globs.some((glob) => path.matchesGlob(file, glob));

  const seeds: string[] = [];
  const ignoredFiles: string[] = [];
  const lockfiles: string[] = [];

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
      lockfiles.push(file);
    } else if (CONFIG_FILE.test(file) && (isRootFile || inBundledPackage)) {
      return all(`build configuration changed (${file})`);
    } else if (CODE_FILE.test(file)) {
      ignoredFiles.push(file);
    } else if (STYLE_FILE.test(file)) {
      ignoredFiles.push(file);
    } else if (inBundledPackage) {
      return all(`${file} is not traceable but is in a package the Storybook bundles`);
    } else {
      ignoredFiles.push(file);
    }
  }

  const unbundledDependencies: UnbundledDependencies[] = [];
  for (const lockfile of lockfiles) {
    const changed = `dependencies changed (${lockfile})`;
    if (!readBaseFile || !isSupportedLockfile(lockfile)) {
      return all(changed);
    }
    if (!graph.packages) {
      return all(`${changed} and ${STATS_FILENAME} does not show which packages are bundled`);
    }

    let packages: string[];
    try {
      const current = path.join(repoRoot, lockfile);
      packages = diffLockfile(
        lockfile,
        await readBaseFile(lockfile),
        existsSync(current) ? await readFile(current, "utf-8") : undefined,
      );
    } catch (error) {
      return all(
        `${changed} and could not be compared (${error instanceof Error ? error.message : String(error)})`,
      );
    }

    const rendering = packages.filter((name) => graph.packages!.has(name) || BUILD_TOOL.test(name));
    if (rendering.length > 0) {
      const more = rendering.length - MAX_LISTED_PACKAGES;
      const listed = rendering.slice(0, MAX_LISTED_PACKAGES).join(", ");
      return all(
        `dependencies changed (${lockfile}: ${listed}${more > 0 ? ` and ${more} more` : ""})`,
      );
    }
    ignoredFiles.push(lockfile);
    unbundledDependencies.push({ lockfile, packages });
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
    unbundledDependencies,
  };
};
