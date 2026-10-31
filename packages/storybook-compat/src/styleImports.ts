import { realpathSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const STYLE_FILE = /\.(css|scss|sass|less|styl|pcss)$/;

const STYLE_EXTENSIONS = [".scss", ".sass", ".css", ".less", ".styl", ".pcss"];
const IMPORT_STATEMENT = /@(import|use|forward|require)\b([^;\n]*)/g;
const COMPOSES_FROM = /composes\s*:[^;}]*?\bfrom\s+["']([^"']+)["']/g;
const SPECIFIER = /["']([^"']+)["']|url\(\s*([^)"'\s]+)\s*\)/g;
const NOT_A_FILE = /^((https?:)?\/\/|data:|sass:)/;

export type UnresolvedStyleImport = { file: string; specifier: string };

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const specifiersOf = (source: string): string[] => {
  const specifiers: string[] = [];
  const code = stripComments(source);

  for (const [, rule, rest] of code.matchAll(IMPORT_STATEMENT)) {
    const found = [...rest!.matchAll(SPECIFIER)].map(([, quoted, url]) => (quoted ?? url)!);
    // `@use "a" with ($b: "c")` has one module; `@import "a", "b"` can have several.
    specifiers.push(...(rule === "use" || rule === "forward" ? found.slice(0, 1) : found));
  }
  for (const [, specifier] of code.matchAll(COMPOSES_FROM)) {
    specifiers.push(specifier!);
  }

  return specifiers.filter((specifier) => !NOT_A_FILE.test(specifier));
};

const isFile = (file: string): boolean => {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
};

/** Resolves like Sass, Less and Stylus: relative to the file, then from node_modules. */
const resolveSpecifier = (specifier: string, fromFile: string): string | undefined => {
  const request = specifier.replace(/^~/, "");
  const fromDir = path.dirname(fromFile);
  const bases = [path.resolve(fromDir, request)];

  if (!request.startsWith(".") && !path.isAbsolute(request)) {
    for (let dir = fromDir; ; dir = path.dirname(dir)) {
      bases.push(path.join(dir, "node_modules", request));
      if (dir === path.dirname(dir)) {
        break;
      }
    }
  }

  for (const base of bases) {
    const partial = path.join(path.dirname(base), `_${path.basename(base)}`);
    const candidates = [
      base,
      ...STYLE_EXTENSIONS.flatMap((extension) => [base + extension, partial + extension]),
      ...STYLE_EXTENSIONS.flatMap((extension) => [
        path.join(base, `_index${extension}`),
        path.join(base, `index${extension}`),
      ]),
    ];
    const found = candidates.find(isFile);
    if (found) {
      return realpathSync(found);
    }
  }

  return undefined;
};

/**
 * Adds the stylesheets that stylesheets in the graph import with `@import`, `@use`,
 * `@forward`, `@require` or `composes`. Builders compile these into the importing
 * stylesheet, so the stats do not list them. Returns the first import that could not
 * be resolved, since an untraced stylesheet could then still be loaded through it.
 */
export const addStyleImports = async (
  importers: Map<string, string[]>,
  repoRoot: string,
): Promise<UnresolvedStyleImport | undefined> => {
  const queue = [...importers.keys()].filter(
    (file) => STYLE_FILE.test(file) && !file.startsWith("/") && !file.includes("node_modules/"),
  );
  const visited = new Set(queue);
  const realRoot = realpathSync(repoRoot);
  let unresolved: UnresolvedStyleImport | undefined;

  while (queue.length > 0) {
    const file = queue.shift()!;
    const absolute = path.join(repoRoot, file);

    let source: string;
    try {
      source = await readFile(absolute, "utf-8");
    } catch {
      continue;
    }

    for (const specifier of specifiersOf(source)) {
      const resolved = resolveSpecifier(specifier, absolute);
      if (!resolved) {
        unresolved ??= { file, specifier };
        continue;
      }

      const imported = path.relative(realRoot, resolved).split(path.sep).join("/");
      if (imported.startsWith("../") || imported.includes("node_modules/")) {
        continue;
      }

      const parents = importers.get(imported) ?? [];
      if (!parents.includes(file)) {
        importers.set(imported, [...parents, file]);
      }
      if (!visited.has(imported)) {
        visited.add(imported);
        queue.push(imported);
      }
    }
  }

  return unresolved;
};
