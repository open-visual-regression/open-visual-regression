import { existsSync, realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

type StatsReason = { moduleName?: string | null };

type StatsModule = {
  name?: string;
  reasons?: StatsReason[];
  // webpack nests modules it concatenated into one under their root module
  modules?: StatsModule[];
};

type IndexEntry = { id: string; importPath: string; type?: string };

export type AffectedStoriesInput = {
  /** The `storybook build` output, built with `--stats-json`. */
  storybookDir: string;
  /** Absolute path of the git repository the Storybook is built from. */
  repoRoot: string;
  /** Files changed since the comparison commit, relative to `repoRoot`. */
  changedFiles: string[];
  /** Storybook's config directory, when it is not `.storybook` next to the stories' project. */
  configDir?: string;
  /** Where the CLI runs, tried as the build's project directory alongside the output's parents. */
  cwd?: string;
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

const ROOT = "(entry)";
const CODE_FILE = /\.[cm]?[jt]sx?$/;
const LOCKFILE =
  /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/;
const CONFIG_FILE =
  /(^|\/)([^/]+\.config\.[cm]?[jt]s|tsconfig[^/]*\.json|\.babelrc[^/]*|\.browserslistrc|\.postcssrc[^/]*)$/;
const PREVIEW_FILE = /(^|\/)preview\.[cm]?[jt]sx?$/;
const NON_RENDERING = [
  /\.md$/,
  /(^|\/)\.(github|changeset|vscode|idea)\//,
  /(^|\/)(LICENSE|CODEOWNERS|\.gitignore|\.gitattributes)$/,
];

const toPosix = (file: string): string => file.split(path.sep).join("/");

export const globToRegExp = (glob: string): RegExp => {
  let source = "";

  for (let i = 0; i < glob.length; i++) {
    const char = glob[i]!;

    if (char === "*" && glob[i + 1] === "*") {
      const slash = glob[i + 2] === "/";
      source += slash ? "(?:.*/)?" : ".*";
      i += slash ? 2 : 1;
    } else if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }

  return new RegExp(`^${source}$`);
};

const matchesAny = (file: string, globs: RegExp[]): boolean =>
  globs.some((glob) => glob.test(file));

const flattenModules = (modules: StatsModule[]): { name: string; importers: string[] }[] =>
  modules.flatMap((module) => {
    const name = module.name;
    if (!name) {
      return [];
    }

    const importers = (module.reasons ?? []).map((reason) => reason.moduleName ?? ROOT);
    const root = { name, importers };
    // A concatenated module's parts are imported through its root module.
    const parts = (module.modules ?? []).flatMap((part) =>
      part.name && part.name !== name ? [{ name: part.name, importers: [name] }] : [],
    );

    return [root, ...parts];
  });

const isRawVirtual = (name: string): boolean =>
  name === ROOT ||
  name.includes("\0") ||
  name.startsWith("/virtual:") ||
  !(name.startsWith("./") || name.startsWith("../") || path.isAbsolute(name));

// Normalized names are repo-relative paths; anything else is tagged so it never matches a file.
const VIRTUAL_PREFIX = "virtual:";
const isVirtual = (name: string): boolean => name.startsWith(VIRTUAL_PREFIX);

const createNormalizer = (projectDir: string, repoRoot: string) => {
  const cache = new Map<string, string>();

  return (rawName: string): string => {
    const cached = cache.get(rawName);
    if (cached !== undefined) {
      return cached;
    }

    // webpack prefixes loaders ("css-loader!./a.css") and names concatenations ("./a.ts + 3 modules")
    const name = rawName
      .slice(rawName.lastIndexOf("!") + 1)
      .replace(/ \+ \d+ modules?$/, "")
      .split("?")[0]!;

    let normalized = `${VIRTUAL_PREFIX}${name}`;
    if (!isRawVirtual(name)) {
      let absolute = path.resolve(projectDir, name);
      // Symlinked workspace packages resolve back to the source files git reports.
      if (absolute.includes(`${path.sep}node_modules${path.sep}`) && existsSync(absolute)) {
        absolute = realpathSync(absolute);
      }
      normalized = toPosix(path.relative(repoRoot, absolute));
    }

    cache.set(rawName, normalized);
    return normalized;
  };
};

const readJson = async <T>(file: string): Promise<T | undefined> => {
  try {
    return JSON.parse(await readFile(file, "utf-8")) as T;
  } catch {
    return undefined;
  }
};

const parentDirs = (from: string, repoRoot: string): string[] => {
  const dirs: string[] = [];
  for (
    let dir = from;
    dir === repoRoot || dir.startsWith(`${repoRoot}${path.sep}`);
    dir = path.dirname(dir)
  ) {
    dirs.push(dir);
    if (dir === repoRoot) {
      break;
    }
  }
  return dirs;
};

// Stats paths are relative to the directory the build ran in, which the output does not record.
const findProjectDir = (candidates: string[], importPaths: string[]): string | undefined =>
  candidates.find((dir) =>
    importPaths.every((importPath) => existsSync(path.resolve(dir, importPath))),
  );

export const findAffectedStories = async ({
  storybookDir,
  repoRoot,
  changedFiles,
  externals = [],
  untraced = [],
  cwd,
  configDir,
}: AffectedStoriesInput): Promise<AffectedStories> => {
  const all = (reason: string): AffectedStories => ({ mode: "all", reason });

  const stats = await readJson<{ modules?: StatsModule[] }>(
    path.join(storybookDir, STATS_FILENAME),
  );
  if (!stats?.modules) {
    return all(`${STATS_FILENAME} is missing; build Storybook with --stats-json`);
  }

  const index = await readJson<{ entries?: Record<string, IndexEntry> }>(
    path.join(storybookDir, "index.json"),
  );
  if (!index?.entries) {
    return all("index.json is missing or has no entries");
  }

  const entries = Object.values(index.entries);
  // Compare real paths: symlinked workspace packages are resolved to theirs below.
  const real = (dir: string): string => (existsSync(dir) ? realpathSync(dir) : path.resolve(dir));
  const root = real(repoRoot);
  const candidates = [
    ...(cwd ? [real(cwd)] : []),
    ...parentDirs(path.dirname(real(storybookDir)), root),
  ];
  const projectDir = findProjectDir(
    candidates,
    entries.map((entry) => entry.importPath),
  );
  if (!projectDir) {
    return all("could not find the story files of this build inside the repository");
  }

  const normalize = createNormalizer(projectDir, root);

  const importers = new Map<string, Set<string>>();
  for (const module of flattenModules(stats.modules)) {
    const name = normalize(module.name);
    const set = importers.get(name) ?? new Set();
    for (const importer of module.importers) {
      const normalized = normalize(importer);
      if (normalized !== name) {
        set.add(normalized);
      }
    }
    importers.set(name, set);
  }

  // Story and docs files are where tracing ends: every story in them is affected.
  const storiesByFile = new Map<string, string[]>();
  for (const entry of entries) {
    const file = normalize(entry.importPath);
    const stories = storiesByFile.get(file) ?? [];
    if (entry.type !== "docs") {
      stories.push(entry.id);
    }
    storiesByFile.set(file, stories);
  }

  if ([...storiesByFile.keys()].some((file) => !importers.has(file))) {
    return all(`${STATS_FILENAME} does not match index.json; rebuild Storybook with --stats-json`);
  }

  const graphFiles = [...importers.keys()].filter((name) => !isVirtual(name));
  // A preview file that imports nothing never shows up in the graph, so also assume the default.
  const configDirs = new Set([
    toPosix(
      path.relative(
        root,
        configDir ? path.resolve(configDir) : path.join(projectDir, ".storybook"),
      ),
    ),
    ...[...graphFiles, ...[...importers.values()].flatMap((set) => [...set])]
      .filter(
        (name) => !isVirtual(name) && PREVIEW_FILE.test(name) && !name.includes("node_modules/"),
      )
      .map((name) => path.posix.dirname(name)),
  ]);

  const packageDirCache = new Map<string, string>();
  const packageDirOf = (file: string): string => {
    const dir = path.posix.dirname(file);
    const cached = packageDirCache.get(dir);
    if (cached !== undefined) {
      return cached;
    }

    const found =
      dir === "." || existsSync(path.join(root, dir, "package.json")) ? dir : packageDirOf(dir);
    packageDirCache.set(dir, found);
    return found;
  };

  // Packages whose source is bundled: a non-code file there may be inlined without being a module.
  const contributing = new Set(
    graphFiles
      .filter((file) => !file.startsWith("../") && !file.includes("node_modules/"))
      .map(packageDirOf),
  );

  const externalGlobs = externals.map(globToRegExp);
  const untracedGlobs = untraced.map(globToRegExp);
  const seeds: string[] = [];
  const ignoredFiles: string[] = [];

  for (const file of changedFiles.map(toPosix)) {
    const inContributing = contributing.has(packageDirOf(file));

    if (matchesAny(file, untracedGlobs)) {
      ignoredFiles.push(file);
    } else if (matchesAny(file, externalGlobs)) {
      return all(`${file} matches "externals"`);
    } else if (importers.has(file)) {
      seeds.push(file);
    } else if ([...configDirs].some((dir) => file.startsWith(`${dir}/`))) {
      return all(`${file} is Storybook configuration`);
    } else if (NON_RENDERING.some((pattern) => pattern.test(file))) {
      ignoredFiles.push(file);
    } else if (LOCKFILE.test(file) && (inContributing || !file.includes("/"))) {
      return all(`dependencies changed (${file})`);
    } else if (CONFIG_FILE.test(file) && (inContributing || !file.includes("/"))) {
      return all(`build configuration changed (${file})`);
    } else if (CODE_FILE.test(file)) {
      // Code only affects a story by being imported, which would put it in the graph.
      ignoredFiles.push(file);
    } else if (inContributing) {
      return all(`${file} is not traceable but is in a package the Storybook bundles`);
    } else {
      ignoredFiles.push(file);
    }
  }

  const via = new Map<string, string | null>(seeds.map((seed) => [seed, null]));
  const chainTo = (file: string): string[] => {
    const chain: string[] = [];
    for (let node: string | null | undefined = file; node; node = via.get(node)) {
      chain.unshift(node);
    }
    return chain;
  };

  const reached: string[] = [];
  const queue = [...seeds];

  while (queue.length > 0) {
    const node = queue.shift()!;
    const isStoryFile = storiesByFile.has(node);

    if (isStoryFile) {
      reached.push(node);
    }

    const parents = importers.get(node) ?? new Set<string>();

    if (!isStoryFile && parents.size === 0) {
      // Nothing imports it, so it is an entry of the preview itself.
      return all(`${chainTo(node).join(" <- ")} is an entry of the Storybook preview`);
    }

    for (const parent of parents) {
      // Above a story file is only the story index, except for stories that import other stories.
      if (isStoryFile && !storiesByFile.has(parent)) {
        continue;
      }

      if (!importers.has(parent)) {
        // The preview entry, an addon or a builder entry: it renders around every story.
        return all(`${chainTo(node).join(" <- ")} is loaded by ${parent}`);
      }

      if (!via.has(parent)) {
        via.set(parent, node);
        queue.push(parent);
      }
    }
  }

  const storyFiles = reached
    .map((file) => ({ file, storyIds: storiesByFile.get(file)!, via: chainTo(file) }))
    .filter((storyFile) => storyFile.storyIds.length > 0);

  return {
    mode: "some",
    storyIds: storyFiles.flatMap((storyFile) => storyFile.storyIds),
    storyFiles,
    ignoredFiles,
  };
};
