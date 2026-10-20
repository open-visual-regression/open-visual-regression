import { describe, expect, it } from "vitest";

import {
  diffPackageJson,
  findChangedLockedPackages,
  isBuildTooling,
  packageNameOf,
} from "../dependencies";

const pnpmLock = (clsx: string, cli: string): string => `lockfileVersion: '9.0'

importers:

  apps/web:
    devDependencies:
      '@open-visual-regression/cli':
        specifier: ^${cli}
        version: ${cli}

packages:

  '@open-visual-regression/cli@${cli}':
    resolution: {integrity: sha512-${cli}}

  clsx@${clsx}:
    resolution: {integrity: sha512-${clsx}}

snapshots:

  '@open-visual-regression/cli@${cli}': {}

  clsx@${clsx}: {}
`;

const berryLock = (clsx: string, ranges = '"clsx@npm:^2.1.1"'): string => `__metadata:
  version: 8
  cacheKey: 10c0

${ranges}:
  version: ${clsx}
  resolution: "clsx@npm:${clsx}"
  checksum: 10c0/${clsx}
  languageName: node
  linkType: hard

"web@workspace:apps/web":
  version: 0.0.0-use.local
  resolution: "web@workspace:apps/web"
  dependencies:
    clsx: "npm:^2.1.1"
  languageName: unknown
  linkType: soft
`;

const npmLock = (clsx: string): string =>
  JSON.stringify({
    lockfileVersion: 3,
    packages: {
      "": { name: "repo", workspaces: ["apps/web"] },
      "apps/web": { name: "web", version: "1.0.0" },
      "node_modules/web": { resolved: "apps/web", link: true },
      "node_modules/clsx": { version: clsx, resolved: `clsx-${clsx}.tgz`, integrity: clsx },
      "node_modules/@scope/pkg/node_modules/clsx": { version: "1.0.0" },
    },
  });

describe("findChangedLockedPackages", () => {
  it("compares pnpm lockfiles by package", () => {
    expect(
      findChangedLockedPackages(
        "pnpm-lock.yaml",
        pnpmLock("2.1.1", "0.8.0"),
        pnpmLock("2.1.1", "0.9.0"),
      ),
    ).toEqual(["@open-visual-regression/cli"]);
  });

  it("compares Yarn Berry lockfiles by what each range resolved to", () => {
    expect(findChangedLockedPackages("yarn.lock", berryLock("2.1.1"), berryLock("2.1.2"))).toEqual([
      "clsx",
    ]);
  });

  it("ignores a new range that resolves to a version already locked", () => {
    expect(
      findChangedLockedPackages(
        "yarn.lock",
        berryLock("2.1.1"),
        berryLock("2.1.1", '"clsx@npm:^2.0.0, clsx@npm:^2.1.1"'),
      ),
    ).toEqual([]);
  });

  it("compares npm lockfiles by install path, skipping workspace links", () => {
    expect(
      findChangedLockedPackages("package-lock.json", npmLock("2.1.1"), npmLock("2.1.2")),
    ).toEqual(["clsx"]);
  });

  it("cannot compare lockfiles it does not know how to read", () => {
    expect(findChangedLockedPackages("bun.lockb", "a", "b")).toBeUndefined();
    expect(findChangedLockedPackages("pnpm-lock.yaml", "lockfileVersion: 5.4", "")).toBeUndefined();
    expect(findChangedLockedPackages("package-lock.json", "{", "{}")).toBeUndefined();
  });
});

describe("diffPackageJson", () => {
  it("lists the dependencies whose ranges changed", () => {
    expect(
      diffPackageJson(
        JSON.stringify({ version: "1.0.0", dependencies: { a: "1", b: "1" } }),
        JSON.stringify({ version: "1.1.0", dependencies: { a: "1", b: "2" } }),
      ),
    ).toEqual({ kind: "dependencies", names: ["b"] });
  });

  it("reports fields that can change how a package is bundled", () => {
    expect(
      diffPackageJson(
        JSON.stringify({ sideEffects: false }),
        JSON.stringify({ sideEffects: true }),
      ),
    ).toEqual({ kind: "fields", fields: ["sideEffects"] });
  });
});

describe("packageNameOf", () => {
  it.each([
    ["./../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs", "clsx"],
    ["./node_modules/@scope/pkg/index.js", "@scope/pkg"],
    ["/repo/node_modules/a/node_modules/@b/c/index.js", "@b/c"],
    ["./src/Button.tsx", undefined],
    ["./node_modules/.cache/x.js", undefined],
  ])("reads %s as %s", (modulePath, name) => {
    expect(packageNameOf(modulePath)).toBe(name);
  });
});

describe("isBuildTooling", () => {
  it.each([
    "storybook",
    "@storybook/react-vite",
    "storybook-react-rsbuild",
    "vite",
    "css-loader",
    "@rsbuild/core",
  ])("treats %s as building the Storybook", (name) => {
    expect(isBuildTooling(name)).toBe(true);
  });

  it.each(["@open-visual-regression/cli", "clsx", "react"])(
    "does not treat %s as tooling",
    (name) => {
      expect(isBuildTooling(name)).toBe(false);
    },
  );
});
