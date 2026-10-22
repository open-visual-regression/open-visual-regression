import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import { parse as parseDependencyPath } from "@pnpm/dependency-path";
import { parseResolution, parseSyml } from "@yarnpkg/parsers";
import { parse as parseJsonc } from "jsonc-parser";
import { parse as parseYaml } from "yaml";

export type LockfileVersions = Map<string, Set<string>>;

type Entry = { name?: string; version?: string };

const toVersions = (entries: Entry[]): LockfileVersions => {
  const versions: LockfileVersions = new Map();
  for (const { name, version } of entries) {
    if (name && version) {
      versions.set(name, (versions.get(name) ?? new Set()).add(version));
    }
  }
  return versions;
};

const nameOf = (descriptor: string): string | undefined =>
  parseResolution(descriptor).descriptor.fullName;

const parsePnpmLock = (contents: string): Entry[] => {
  const lock = parseYaml(contents) as Record<string, Record<string, unknown> | undefined>;
  return [...Object.keys(lock.packages ?? {}), ...Object.keys(lock.snapshots ?? {})].map((key) =>
    // v6 keys start with "/".
    parseDependencyPath(key.replace(/^\//, "")),
  );
};

type NpmLockV1Dependencies = Record<
  string,
  { version?: string; dependencies?: NpmLockV1Dependencies }
>;

const parseNpmLock = (contents: string): Entry[] => {
  const lock = JSON.parse(contents) as {
    packages?: Record<string, { version?: string }>;
    dependencies?: NpmLockV1Dependencies;
  };
  if (lock.packages) {
    return Object.entries(lock.packages)
      .filter(([key]) => key.includes("node_modules/"))
      .map(([key, { version }]) => ({ name: key.split("node_modules/").at(-1), version }));
  }
  const flatten = (dependencies: NpmLockV1Dependencies = {}): Entry[] =>
    Object.entries(dependencies).flatMap(([name, dependency]) => [
      { name, version: dependency.version },
      ...flatten(dependency.dependencies),
    ]);
  return flatten(lock.dependencies);
};

const parseYarnLock = (contents: string): Entry[] =>
  Object.entries(parseSyml(contents) as Record<string, { version?: string }>)
    .filter(([key]) => key !== "__metadata")
    .map(([key, { version }]) => ({ name: nameOf(key.split(",")[0]!.trim()), version }));

const parseBunLock = (contents: string): Entry[] => {
  const lock = parseJsonc(contents) as { packages?: Record<string, [string, ...unknown[]]> };
  return Object.values(lock.packages ?? {}).map(([spec]) => {
    const { descriptor } = parseResolution(spec);
    return { name: descriptor.fullName, version: descriptor.description };
  });
};

const PARSERS: Record<string, (contents: string) => Entry[]> = {
  "pnpm-lock.yaml": parsePnpmLock,
  "package-lock.json": parseNpmLock,
  "npm-shrinkwrap.json": parseNpmLock,
  "yarn.lock": parseYarnLock,
  "bun.lock": parseBunLock,
};

// Undefined when unreadable, like the binary bun.lockb.
export const readLockfileVersions = (
  file: string,
  contents: string,
): LockfileVersions | undefined => {
  const parse = PARSERS[path.posix.basename(file)];
  if (!parse) {
    return undefined;
  }
  try {
    const versions = toVersions(parse(contents));
    return versions.size > 0 || contents.trim() === "" ? versions : undefined;
  } catch {
    return undefined;
  }
};

export const findChangedPackages = (base: LockfileVersions, current: LockfileVersions): string[] =>
  [...new Set([...base.keys(), ...current.keys()])]
    .filter((name) => !isDeepStrictEqual(base.get(name), current.get(name)))
    .sort();
