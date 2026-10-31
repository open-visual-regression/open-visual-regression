import { parse as parseYaml } from "yaml";

type LockedPackages = Map<string, Set<string>>;

// Packages in the repository, whose files the module graph already traces.
const LOCAL_PROTOCOL = /^(workspace|link|portal):/;

const lockedPackages = (entries: [name: string, entry: unknown][]): LockedPackages => {
  const packages: LockedPackages = new Map();
  for (const [name, entry] of entries) {
    packages.set(name, (packages.get(name) ?? new Set()).add(JSON.stringify(entry)));
  }
  return packages;
};

const splitDescriptor = (descriptor: string): [name: string, range: string] => {
  const at = descriptor.indexOf("@", 1);
  if (at <= 0) {
    throw new Error(`cannot read the package name in "${descriptor}"`);
  }
  return [descriptor.slice(0, at), descriptor.slice(at + 1)];
};

const checkVersion = (version: unknown, supported: number[]): void => {
  if (!supported.includes(Number.parseInt(String(version), 10))) {
    throw new Error(`lockfile version ${String(version)} is not supported`);
  }
};

const parseYarnClassicLock = (text: string): LockedPackages => {
  const entries: [string, Record<string, string>][] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "" || line.startsWith("#")) {
      continue;
    }
    if (!line.startsWith(" ")) {
      const [descriptor = ""] = line.replace(/:$/, "").replaceAll('"', "").split(", ");
      entries.push([splitDescriptor(descriptor)[0], {}]);
      continue;
    }
    const field = /^ {2}(version|resolved|integrity) "?([^"]*)"?$/.exec(line);
    if (field && entries.length > 0) {
      entries.at(-1)![1][field[1]!] = field[2]!;
    }
  }
  return lockedPackages(entries);
};

type YarnBerryLock = Record<
  string,
  { version?: string | number; resolution?: string; checksum?: string }
>;

const parseYarnLock = (text: string): LockedPackages => {
  if (text.includes("# yarn lockfile v1")) {
    return parseYarnClassicLock(text);
  }

  const { __metadata, ...lock } = parseYaml(text) as YarnBerryLock;
  checkVersion(__metadata?.version, [4, 5, 6, 7, 8]);

  return lockedPackages(
    Object.values(lock).flatMap(({ version, resolution = "", checksum }) => {
      const [name, reference] = splitDescriptor(resolution);
      return LOCAL_PROTOCOL.test(reference) ? [] : [[name, { version, resolution, checksum }]];
    }),
  );
};

type PnpmLock = {
  lockfileVersion?: string | number;
  packages?: Record<string, { name?: string; resolution?: unknown }>;
};

const parsePnpmLock = (text: string): LockedPackages => {
  const lock = parseYaml(text) as PnpmLock;
  checkVersion(lock.lockfileVersion, [6, 9]);

  return lockedPackages(
    Object.entries(lock.packages ?? {}).flatMap(([key, { name, resolution }]) => {
      // "/name@1.0.0(peer@1.0.0)" in v6, "name@1.0.0" in v9.
      const id = key.replace(/^\//, "").replace(/\(.*$/, "");
      const [keyName, reference] = splitDescriptor(id);
      return LOCAL_PROTOCOL.test(reference) ? [] : [[name ?? keyName, { id, resolution }]];
    }),
  );
};

type NpmLock = {
  lockfileVersion?: number;
  packages?: Record<
    string,
    { version?: string; resolved?: string; integrity?: string; link?: boolean }
  >;
};

const parseNpmLock = (text: string): LockedPackages => {
  const lock = JSON.parse(text) as NpmLock;
  checkVersion(lock.lockfileVersion, [2, 3]);

  return lockedPackages(
    Object.entries(lock.packages ?? {}).flatMap(
      ([location, { version, resolved, integrity, link }]) => {
        const at = location.lastIndexOf("node_modules/");
        return at < 0 || link
          ? []
          : [[location.slice(at + "node_modules/".length), { version, resolved, integrity }]];
      },
    ),
  );
};

const PARSERS: Record<string, (text: string) => LockedPackages> = {
  "yarn.lock": parseYarnLock,
  "pnpm-lock.yaml": parsePnpmLock,
  "package-lock.json": parseNpmLock,
  "npm-shrinkwrap.json": parseNpmLock,
};

const parserFor = (file: string) => PARSERS[file.slice(file.lastIndexOf("/") + 1)];

export const isSupportedLockfile = (file: string): boolean => parserFor(file) !== undefined;

export const diffLockfile = (
  file: string,
  before: string | undefined,
  after: string | undefined,
): string[] => {
  const parse = parserFor(file);
  if (!parse) {
    throw new Error(`${file} is not a supported lockfile`);
  }

  const [old, next] = [before, after].map((text) =>
    text === undefined ? new Map() : parse(text),
  ) as [LockedPackages, LockedPackages];

  const sameEntries = (a = new Set<string>(), b = new Set<string>()): boolean =>
    a.size === b.size && [...a].every((entry) => b.has(entry));

  return [...new Set([...old.keys(), ...next.keys()])]
    .filter((name) => !sameEntries(old.get(name), next.get(name)))
    .sort();
};
