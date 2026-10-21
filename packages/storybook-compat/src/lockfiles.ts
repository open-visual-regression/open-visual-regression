import path from "node:path";

/** Every version of each package a lockfile resolves, by package name. */
export type LockfileVersions = Map<string, Set<string>>;

const addVersion = (versions: LockfileVersions, name: string, version: string): void => {
  if (!name || !version) {
    return;
  }
  const known = versions.get(name) ?? new Set<string>();
  known.add(version);
  versions.set(name, known);
};

const unquote = (value: string): string => value.trim().replace(/^["']|["']$/g, "");

// `name@version`, where a scoped name starts with its own "@".
const splitNameAtVersion = (spec: string): [string, string] | undefined => {
  const at = spec.indexOf("@", 1);
  return at > 0 ? [spec.slice(0, at), spec.slice(at + 1)] : undefined;
};

// v9 `name@1.0.0(peer@2.0.0)`, v6 `/name@1.0.0(peer@2.0.0)`, v5 `/name/1.0.0_peer@2.0.0`.
const PNPM_V5_KEY = /^((?:@[^/]+\/)?[^/@]+)\/(\d[^/_]*)(?:_.*)?$/;

const parsePnpmKey = (key: string): [string, string] | undefined => {
  const spec = unquote(key).replace(/^\//, "").replace(/\(.*$/, "");
  const v5 = PNPM_V5_KEY.exec(spec);
  return v5 ? [v5[1]!, v5[2]!] : splitNameAtVersion(spec);
};

const parsePnpmLock = (contents: string): LockfileVersions => {
  const versions: LockfileVersions = new Map();
  let inPackages = false;

  for (const line of contents.split("\n")) {
    if (/^\S/.test(line)) {
      inPackages = /^(packages|snapshots):\s*$/.test(line);
      continue;
    }
    const entry = inPackages ? /^ {2}(\S.*):\s*$/.exec(line) : null;
    const nameAndVersion = entry && parsePnpmKey(entry[1]!);
    if (nameAndVersion) {
      addVersion(versions, ...nameAndVersion);
    }
  }

  return versions;
};

type NpmLockV1Dependencies = Record<
  string,
  { version?: string; dependencies?: NpmLockV1Dependencies }
>;

const parseNpmLock = (contents: string): LockfileVersions => {
  const versions: LockfileVersions = new Map();
  const lock = JSON.parse(contents) as {
    packages?: Record<string, { version?: string }>;
    dependencies?: NpmLockV1Dependencies;
  };

  if (lock.packages) {
    for (const [key, { version }] of Object.entries(lock.packages)) {
      const at = key.lastIndexOf("node_modules/");
      if (at !== -1 && version) {
        addVersion(versions, key.slice(at + "node_modules/".length), version);
      }
    }
    return versions;
  }

  const walk = (dependencies: NpmLockV1Dependencies = {}): void => {
    for (const [name, dependency] of Object.entries(dependencies)) {
      if (dependency.version) {
        addVersion(versions, name, dependency.version);
      }
      walk(dependency.dependencies);
    }
  };
  walk(lock.dependencies);
  return versions;
};

// v1 `"name@^1.0.0", name@^1.1.0:` then `  version "1.1.2"`; berry `"name@npm:^1.0.0":` then
// `  version: 1.1.2`.
const parseYarnLock = (contents: string): LockfileVersions => {
  const versions: LockfileVersions = new Map();
  let name: string | undefined;

  for (const line of contents.split("\n")) {
    if (/^[^\s#].*:\s*$/.test(line)) {
      const descriptor = unquote(line.replace(/:\s*$/, "").split(",")[0]!);
      name = splitNameAtVersion(descriptor)?.[0];
      continue;
    }
    const version = name ? /^ {2}version:? "?([^"\s]+)"?\s*$/.exec(line) : null;
    if (name && version) {
      addVersion(versions, name, version[1]!);
    }
  }

  return versions;
};

// Text bun.lock: `"key": ["name@version", ...]` under "packages".
const parseBunLock = (contents: string): LockfileVersions => {
  const versions: LockfileVersions = new Map();
  const packages = contents.slice(contents.indexOf('"packages"'));

  for (const match of packages.matchAll(/^\s*"[^"]+":\s*\[\s*"([^"]+)"/gm)) {
    const nameAndVersion = splitNameAtVersion(match[1]!);
    if (nameAndVersion) {
      addVersion(versions, ...nameAndVersion);
    }
  }

  return versions;
};

const PARSERS: Record<string, (contents: string) => LockfileVersions> = {
  "pnpm-lock.yaml": parsePnpmLock,
  "package-lock.json": parseNpmLock,
  "npm-shrinkwrap.json": parseNpmLock,
  "yarn.lock": parseYarnLock,
  "bun.lock": parseBunLock,
};

/** Undefined for a lockfile it can't read, like the binary bun.lockb. */
export const readLockfileVersions = (
  file: string,
  contents: string,
): LockfileVersions | undefined => {
  const parse = PARSERS[path.posix.basename(file)];
  if (!parse) {
    return undefined;
  }
  try {
    const versions = parse(contents);
    return versions.size > 0 || contents.trim() === "" ? versions : undefined;
  } catch {
    return undefined;
  }
};

/** Packages added, removed, or resolved to a different version. */
export const findChangedPackages = (
  base: LockfileVersions,
  current: LockfileVersions,
): string[] => {
  const sameVersions = (a: Set<string> | undefined, b: Set<string> | undefined): boolean =>
    a !== undefined && b !== undefined && a.size === b.size && [...a].every((v) => b.has(v));

  return [...new Set([...base.keys(), ...current.keys()])]
    .filter((name) => !sameVersions(base.get(name), current.get(name)))
    .sort();
};
