import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

type StatsModule = { name: string; reasons?: { moduleName: string }[] };

type IndexEntry = { id: string; importPath: string; type?: string };

export type AffectedStoriesInput = {
  /** The `storybook build` output, built with `--stats-json`. */
  storybookDir: string;
  /** The directory `storybook build` ran in; the stats' paths are relative to it. */
  projectDir: string;
  /** Absolute path of the git repository the Storybook is built from. */
  repoRoot: string;
  /** Files changed since the comparison commit, relative to `repoRoot`. */
  changedFiles: string[];
  /** Globs (relative to `repoRoot`) that re-capture every story when they change. */
  externals?: string[];
  /** Globs (relative to `repoRoot`) whose changes never affect a story. */
  untraced?: string[];
};

export type AffectedStoryFile = {
  file: string;
  storyIds: string[];
  /** Import chain from a changed file to this story file. */
  via: string[];
};

export type AffectedStories =
  | { mode: "all"; reason: string }
  | {
      mode: "some";
      storyIds: string[];
      storyFiles: AffectedStoryFile[];
      /** Changed files that cannot affect a story. */
      ignoredFiles: string[];
    };

export const STATS_FILENAME = "preview-stats.json";

const CODE_FILE = /\.[cm]?[jt]sx?$/;
const LOCKFILE =
  /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/;
const CONFIG_FILE = /(^|\/)([^/]+\.config\.[cm]?[jt]s|tsconfig[^/]*\.json)$/;
const NON_RENDERING = /\.md$|(^|\/)\.(github|changeset)\//;

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
}: AffectedStoriesInput): Promise<AffectedStories> => {
  const all = (reason: string): AffectedStories => ({ mode: "all", reason });

  const stats = await readJson<{ modules?: StatsModule[] }>(
    path.join(storybookDir, STATS_FILENAME),
  );
  const index = await readJson<{ entries?: Record<string, IndexEntry> }>(
    path.join(storybookDir, "index.json"),
  );
  if (!stats?.modules || !index?.entries) {
    return all(`${STATS_FILENAME} or index.json is missing; build Storybook with --stats-json`);
  }

  // Stats and index paths are relative to the project ("./src/a.tsx"); anything else is virtual.
  const toRepoPath = (name: string): string =>
    name.startsWith(".")
      ? path.relative(repoRoot, path.resolve(projectDir, name)).split(path.sep).join("/")
      : name;

  const importers = new Map(
    stats.modules.map((module) => [
      toRepoPath(module.name),
      (module.reasons ?? [])
        .filter((reason) => reason.moduleName !== module.name)
        .map((reason) => toRepoPath(reason.moduleName)),
    ]),
  );

  // Story and docs files are where tracing ends: every story in them is affected.
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

  // Packages whose source is bundled: a non-code file there may be inlined without being a module.
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
      return all(`dependencies changed (${file})`);
    } else if (CONFIG_FILE.test(file) && (isRootFile || inBundledPackage)) {
      return all(`build configuration changed (${file})`);
    } else if (CODE_FILE.test(file)) {
      // Code only affects a story by being imported, which would put it in the graph.
      ignoredFiles.push(file);
    } else if (inBundledPackage) {
      return all(`${file} is not traceable but is in a package the Storybook bundles`);
    } else {
      ignoredFiles.push(file);
    }
  }

  // Walk up from each changed module, remembering how each file was reached.
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
      // Above a story file is only the story index, except for stories that import other stories.
      if (isStoryFile && !storiesByFile.has(parent)) {
        continue;
      }

      if (!importers.has(parent)) {
        // The preview (preview.tsx) or a builder entry: it renders around every story.
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
