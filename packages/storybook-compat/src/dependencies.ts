import path from "node:path";

// Package name → everything its lockfile entries pin (versions, tarballs, hashes), so two
// versions of a lockfile can be compared package by package.
type LockedPackages = Map<string, string[]>;

const nameOf = (descriptor: string): string | undefined => {
  const at = descriptor.indexOf("@", 1);
  return at > 0 ? descriptor.slice(0, at) : undefined;
};

const addLocked = (locked: LockedPackages, name: string, entry: string): void => {
  locked.set(name, [...(locked.get(name) ?? []), entry]);
};

const unquote = (text: string): string => text.trim().replace(/^["']|["']$/g, "");

// Yarn classic and Berry: an unindented header listing the ranges ("clsx@^2.0.0, clsx@^2.1.1:")
// and an indented body with what they resolved to. Only the body is compared, so adding a
// range that resolves to the same version is not a change.
const readYarnLock = (contents: string): LockedPackages => {
  const locked: LockedPackages = new Map();
  let name: string | undefined;
  let body: string[] = [];

  const flush = () => {
    if (name) {
      addLocked(locked, name, body.join("\n"));
    }
  };

  for (const line of contents.split(/\r?\n/)) {
    if (line.trim() === "" || line.startsWith("#")) {
      continue;
    }
    if (/^\s/.test(line)) {
      body.push(line.trim());
      continue;
    }

    flush();
    const descriptor = unquote(line.replace(/:$/, "").split(",")[0]!);
    // Workspaces are compared through their package.json, and __metadata is not a package.
    name = descriptor.includes("@workspace:") ? undefined : nameOf(descriptor);
    body = [];
  }
  flush();

  return locked;
};

// pnpm 6+: "packages:" and "snapshots:" map "name@version(peers)" keys to their metadata.
// "importers:" only repeats each workspace's ranges, which their package.json covers.
const readPnpmLock = (contents: string): LockedPackages | undefined => {
  const version = /^lockfileVersion:\s*['"]?(\d+)/m.exec(contents)?.[1];
  if (!version || Number(version) < 6) {
    return undefined;
  }

  const locked: LockedPackages = new Map();
  let inPackages = false;
  let entry: { name: string; lines: string[] } | undefined;

  const flush = () => {
    if (entry) {
      addLocked(locked, entry.name, entry.lines.join("\n"));
    }
    entry = undefined;
  };

  for (const line of contents.split(/\r?\n/)) {
    if (line.trim() === "") {
      continue;
    }
    if (!/^\s/.test(line)) {
      flush();
      inPackages = /^(packages|snapshots):/.test(line);
    } else if (inPackages && /^ {2}\S/.test(line)) {
      flush();
      const key = unquote(line.replace(/:\s*(\{\})?\s*$/, "")).replace(/^\//, "");
      const name = nameOf(key);
      entry = name ? { name, lines: [key] } : undefined;
    } else {
      entry?.lines.push(line.trim());
    }
  }
  flush();

  return locked;
};

type NpmLock = {
  packages?: Record<
    string,
    { version?: string; resolved?: string; integrity?: string; link?: boolean }
  >;
};

// npm 7+: "packages" maps install paths ("node_modules/a/node_modules/b") to what is there.
const readNpmLock = (contents: string): LockedPackages | undefined => {
  let lock: NpmLock;
  try {
    lock = JSON.parse(contents) as NpmLock;
  } catch {
    return undefined;
  }
  if (!lock.packages) {
    return undefined;
  }

  const locked: LockedPackages = new Map();
  for (const [installPath, { version, resolved, integrity, link }] of Object.entries(
    lock.packages,
  )) {
    const name = packageNameOf(installPath);
    if (name && !link) {
      addLocked(locked, name, `${installPath} ${version} ${resolved} ${integrity}`);
    }
  }

  return locked;
};

const readLockfile = (file: string, contents: string): LockedPackages | undefined => {
  switch (path.posix.basename(file)) {
    case "yarn.lock":
      return readYarnLock(contents);
    case "pnpm-lock.yaml":
      return readPnpmLock(contents);
    case "package-lock.json":
    case "npm-shrinkwrap.json":
      return readNpmLock(contents);
    default:
      return undefined;
  }
};

const sameEntries = (a: string[] | undefined, b: string[] | undefined): boolean =>
  JSON.stringify(a && [...a].sort()) === JSON.stringify(b && [...b].sort());

/** The packages whose locked version changed, or undefined for a lockfile this can't read. */
export const findChangedLockedPackages = (
  file: string,
  base: string,
  head: string,
): string[] | undefined => {
  const before = readLockfile(file, base);
  const after = readLockfile(file, head);
  if (!before || !after) {
    return undefined;
  }

  return [...new Set([...before.keys(), ...after.keys()])].filter(
    (name) => !sameEntries(before.get(name), after.get(name)),
  );
};

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

// Fields that cannot change what a bundler resolves or emits. Anything else ("exports",
// "imports", "browser", "sideEffects", "resolutions", …) can.
const NON_RENDERING_FIELDS = new Set([
  ...DEPENDENCY_FIELDS,
  "peerDependenciesMeta",
  "name",
  "version",
  "description",
  "keywords",
  "homepage",
  "bugs",
  "license",
  "author",
  "contributors",
  "maintainers",
  "funding",
  "repository",
  "scripts",
  "files",
  "bin",
  "man",
  "directories",
  "private",
  "publishConfig",
  "engines",
  "os",
  "cpu",
  "packageManager",
  "devEngines",
  "volta",
]);

type PackageJson = Record<string, unknown>;

export type PackageJsonChange =
  | { kind: "fields"; fields: string[] }
  | { kind: "dependencies"; names: string[] };

const parsePackageJson = (contents: string): PackageJson | undefined => {
  try {
    const parsed: unknown = JSON.parse(contents);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as PackageJson)
      : undefined;
  } catch {
    return undefined;
  }
};

const rangesOf = (pkg: PackageJson, name: string): string =>
  JSON.stringify(
    DEPENDENCY_FIELDS.map((field) => (pkg[field] as Record<string, unknown> | undefined)?.[name]),
  );

/**
 * What changed between two versions of a package.json: fields that can change the bundle, or
 * else the dependencies whose ranges changed. Undefined when either version is not valid JSON.
 */
export const diffPackageJson = (base: string, head: string): PackageJsonChange | undefined => {
  const before = parsePackageJson(base);
  const after = parsePackageJson(head);
  if (!before || !after) {
    return undefined;
  }

  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (field) =>
      !NON_RENDERING_FIELDS.has(field) &&
      JSON.stringify(before[field]) !== JSON.stringify(after[field]),
  );
  if (fields.length > 0) {
    return { kind: "fields", fields };
  }

  const names = new Set(
    DEPENDENCY_FIELDS.flatMap((field) => [
      ...Object.keys((before[field] as object | undefined) ?? {}),
      ...Object.keys((after[field] as object | undefined) ?? {}),
    ]),
  );
  return {
    kind: "dependencies",
    names: [...names].filter((name) => rangesOf(before, name) !== rangesOf(after, name)),
  };
};

/** The npm package a module path is installed as, e.g. "clsx" for ".pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs". */
export const packageNameOf = (modulePath: string): string | undefined => {
  const index = modulePath.lastIndexOf("node_modules/");
  if (index === -1) {
    return undefined;
  }

  const [scope, name] = modulePath.slice(index + "node_modules/".length).split("/");
  if (!scope || scope.startsWith(".") || (scope.startsWith("@") && !name)) {
    return undefined;
  }
  return scope.startsWith("@") ? `${scope}/${name}` : scope;
};

// Packages that transform or emit the bundle without being modules in it: Storybook itself,
// bundlers, compilers, and CSS tooling.
const BUILD_TOOLING = [
  /^storybook$/,
  /storybook/,
  /^@(storybook|babel|swc|rsbuild|rspack|vitejs|tailwindcss|vanilla-extract|svgr|mdx-js)\//,
  /^(vite|webpack|rollup|rolldown|esbuild|postcss|tailwindcss|sass|sass-embedded|less|stylus|lightningcss|autoprefixer)$/,
  /^(vite|webpack|rsbuild|rspack|rollup|esbuild|postcss|babel)-/,
  /-loader$/,
];

export const isBuildTooling = (name: string): boolean =>
  BUILD_TOOLING.some((pattern) => pattern.test(name));
