/** What a lockfile pins for each package name, as a set of comparable entries. */
export type LockedPackages = Map<string, Set<string>>;

const add = (packages: LockedPackages, name: string, entry: string): void => {
  packages.set(name, (packages.get(name) ?? new Set()).add(entry));
};

// Dependencies resolved from the repository itself, whose source files the module graph traces.
const LOCAL_PROTOCOL = /^(workspace|link|portal):/;

const indentOf = (line: string): number => line.length - line.trimStart().length;

const unquote = (value: string): string => value.replace(/^(["'])(.*)\1$/, "$2");

/** "react@^18.0.0" or "@types/react@npm:^18.0.0" -> ["react", "^18.0.0"]. */
const splitDescriptor = (descriptor: string): [string, string] => {
  const at = descriptor.indexOf("@", 1);
  if (at <= 0) {
    throw new Error(`cannot read the package name in "${descriptor}"`);
  }
  return [descriptor.slice(0, at), descriptor.slice(at + 1)];
};

/** Top-level blocks of a YAML-like file: each unindented line with the lines nested under it. */
const topLevelBlocks = (text: string): { key: string; body: string[] }[] => {
  const blocks: { key: string; body: string[] }[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "" || line.startsWith("#")) {
      continue;
    }
    if (indentOf(line) > 0) {
      if (blocks.length === 0) {
        throw new Error("found an indented line before any entry");
      }
      blocks.at(-1)!.body.push(line);
    } else {
      blocks.push({ key: line, body: [] });
    }
  }
  return blocks;
};

// yarn.lock, both v1 ("# yarn lockfile v1") and Berry ("__metadata:").
const parseYarnLock = (text: string): LockedPackages => {
  const packages: LockedPackages = new Map();

  for (const { key, body } of topLevelBlocks(text)) {
    if (!key.endsWith(":")) {
      throw new Error(`unexpected line "${key}"`);
    }
    if (key === "__metadata:") {
      continue;
    }
    // The key lists every range that resolved to this entry; ranges that resolve the
    // same way leave what is installed unchanged, so only the body is compared.
    const entry = body.map((line) => line.trim()).join("\n");
    // v1 quotes each range ("a@^1", "a@^2":), Berry the whole list ("a@npm:^1, a@npm:^2":).
    for (const descriptor of key.slice(0, -1).replaceAll('"', "").split(/,\s*/)) {
      const [name, range] = splitDescriptor(descriptor.trim());
      if (!LOCAL_PROTOCOL.test(range)) {
        add(packages, name, entry);
      }
    }
  }

  return packages;
};

// Fields of a pnpm package entry that list other packages, which have entries of their own.
const PNPM_LINK_FIELDS = new Set([
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "transitivePeerDependencies",
]);

// pnpm-lock.yaml, lockfile versions 6 and later.
const parsePnpmLock = (text: string): LockedPackages => {
  const blocks = topLevelBlocks(text);
  const version = blocks.find(({ key }) => key.startsWith("lockfileVersion:"));
  const major = Number.parseInt(unquote(version?.key.split(":")[1]?.trim() ?? ""), 10);
  if (!(major >= 6)) {
    throw new Error("only lockfile version 6 and later are supported");
  }

  const packages: LockedPackages = new Map();
  // "packages" pins the version and integrity of each package. "snapshots" (v9) and
  // "importers" only say how they link together.
  const lines = blocks.find(({ key }) => key === "packages:")?.body ?? [];
  let current: { name: string; entry: string[] } | undefined;
  let skipField = false;

  const flush = () => {
    if (current) {
      add(packages, current.name, current.entry.join("\n"));
    }
  };

  for (const line of lines) {
    const indent = indentOf(line);
    const trimmed = line.trim();
    if (indent === 2) {
      flush();
      const match = /^(.+?):(\s*\{\})?$/.exec(trimmed);
      if (!match) {
        throw new Error(`unexpected line "${trimmed}"`);
      }
      // "/@scope/name@1.0.0(react@18.0.0)" (v6) or "'@scope/name@1.0.0'" (v9).
      const id = unquote(match[1]!).replace(/^\//, "").replace(/\(.*$/, "");
      const [name, reference] = splitDescriptor(id);
      current = LOCAL_PROTOCOL.test(reference) ? undefined : { name, entry: [id] };
      skipField = false;
    } else if (indent === 4) {
      skipField = PNPM_LINK_FIELDS.has(trimmed.replace(/:.*$/, ""));
      if (!skipField) {
        current?.entry.push(trimmed);
      }
    } else if (!skipField) {
      current?.entry.push(trimmed);
    }
  }
  flush();

  return packages;
};

type NpmPackage = {
  version?: string;
  resolved?: string;
  integrity?: string;
  link?: boolean;
};

// package-lock.json and npm-shrinkwrap.json, lockfile versions 2 and 3.
const parseNpmLock = (text: string): LockedPackages => {
  const lock = JSON.parse(text) as { packages?: Record<string, NpmPackage> };
  if (!lock.packages) {
    throw new Error("only lockfile version 2 and later are supported");
  }

  const packages: LockedPackages = new Map();
  for (const [location, { version, resolved, integrity, link }] of Object.entries(lock.packages)) {
    const at = location.lastIndexOf("node_modules/");
    // Entries without node_modules in their location are workspace packages.
    if (at < 0 || link) {
      continue;
    }
    add(
      packages,
      location.slice(at + "node_modules/".length),
      [version, resolved, integrity].join(" "),
    );
  }

  return packages;
};

const PARSERS: Record<string, (text: string) => LockedPackages> = {
  "yarn.lock": parseYarnLock,
  "pnpm-lock.yaml": parsePnpmLock,
  "package-lock.json": parseNpmLock,
  "npm-shrinkwrap.json": parseNpmLock,
};

export const isSupportedLockfile = (file: string): boolean =>
  Object.hasOwn(PARSERS, file.slice(file.lastIndexOf("/") + 1));

/**
 * Package names whose locked entries differ between two versions of a lockfile.
 * `undefined` contents mean the file does not exist on that side. Throws when either
 * side cannot be parsed.
 */
export const diffLockfile = (
  file: string,
  before: string | undefined,
  after: string | undefined,
): string[] => {
  const parse = PARSERS[file.slice(file.lastIndexOf("/") + 1)];
  if (!parse) {
    throw new Error(`${file} is not a supported lockfile`);
  }

  const [old, next] = [before, after].map((text) =>
    text === undefined ? new Map<string, Set<string>>() : parse(text),
  ) as [LockedPackages, LockedPackages];

  const sameEntries = (a: Set<string> | undefined, b: Set<string> | undefined): boolean =>
    a?.size === b?.size && [...(a ?? [])].every((entry) => b?.has(entry));

  return [...new Set([...old.keys(), ...next.keys()])]
    .filter((name) => !sameEntries(old.get(name), next.get(name)))
    .sort();
};
