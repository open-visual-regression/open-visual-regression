type WebpackModule = {
  name?: string | null;
  reasons?: { moduleName?: string | null }[];
  modules?: WebpackModule[];
};

export type WebpackStats = { modules: WebpackModule[] };

// The suffix of a concatenated module's name: "./src/Button.stories.jsx + 2 modules".
const CONCATENATED = / \+ \d+ modules?$/;
// A context module, from require.context or import() with a variable. Webpack writes
// "./src/ lazy ^\.\/.*$ …", Rspack "./src|lazy|/^\.\/.*$/|…".
const CONTEXT = /[ |](lazy|sync|eager|weak|lazy-once)[ |]/;
// Modules with no file behind them.
const NOT_A_FILE = /^(external |ignored |webpack\/runtime\/|\(webpack\)|data:)/;
// A path starting with "./", "../" or "/". storybook-builder-rsbuild 3.3+ leaves off the "./".
const RELATIVE = /^\.{0,2}\//;
// The module Storybook generates to load every stories glob.
const STORIES_ENTRY = /(^|\/)storybook-stories\.js$/;

const toFileName = (name: string): string | undefined => {
  // Drops loaders ("css-loader…!./src/Button.css") and queries ("?inline").
  const [file] = name
    .slice(name.lastIndexOf("!") + 1)
    .replace(CONCATENATED, "")
    .split("?");
  if (!file || NOT_A_FILE.test(file)) {
    return undefined;
  }
  return RELATIVE.test(file) ? file : `./${file}`;
};

const flatten = (modules: WebpackModule[]): WebpackModule[] =>
  modules.flatMap((module) => [module, ...flatten(module.modules ?? [])]);

const addAll = (map: Map<string, Set<string>>, key: string, values: string[]): void => {
  map.set(key, new Set([...(map.get(key) ?? []), ...values]));
};

export const readWebpackImporters = (
  stats: WebpackStats,
  storyFiles: Set<string>,
): Map<string, string[]> => {
  const importers = new Map<string, Set<string>>();
  const contexts = new Map<string, Set<string>>();

  // Maps each module to the files it was bundled into. Webpack and Rspack can merge a file
  // into the story file that imports it ("./src/Button.stories.jsx + 1 modules"). The stats
  // then often say the file was loaded by the stories glob instead of by that story file.
  // Recording the story file lets us use it as the real importer.
  const roots = new Map<string, Set<string>>();
  for (const outer of stats.modules) {
    const root = outer.name && outer.modules?.length ? toFileName(outer.name) : undefined;
    if (!root) {
      continue;
    }
    for (const inner of flatten(outer.modules ?? [])) {
      const name = inner.name && toFileName(inner.name);
      if (name && name !== root) {
        addAll(roots, name, [root]);
      }
    }
  }

  for (const module of flatten(stats.modules)) {
    const name = module.name ? toFileName(module.name) : undefined;
    const parents = (module.reasons ?? []).flatMap(({ moduleName }) => {
      if (!moduleName) {
        return [];
      }
      if (CONTEXT.test(moduleName)) {
        return [moduleName, ...(name ? (roots.get(name) ?? []) : [])];
      }
      const parent = toFileName(moduleName);
      return parent ? [parent] : [];
    });

    if (!module.name) {
      continue;
    }

    if (CONTEXT.test(module.name)) {
      addAll(contexts, module.name, parents);
    } else if (name) {
      addAll(importers, name, parents);
    }
  }

  const resolve = (parent: string, seen: Set<string>): string[] => {
    const contextParents = contexts.get(parent);
    if (!contextParents) {
      return [parent];
    }
    if (seen.has(parent)) {
      return [];
    }
    seen.add(parent);
    return [...contextParents].flatMap((contextParent) => resolve(contextParent, seen));
  };

  const loadsStories = (parent: string): boolean =>
    [...(contexts.get(parent) ?? [])].some((contextParent) => STORIES_ENTRY.test(contextParent));

  return new Map(
    [...importers].map(([name, parents]) => [
      name,
      [
        ...new Set(
          [...parents]
            .filter((parent) => storyFiles.has(name) || !loadsStories(parent))
            .flatMap((parent) => resolve(parent, new Set())),
        ),
      ].filter((parent) => parent !== name),
    ]),
  );
};
