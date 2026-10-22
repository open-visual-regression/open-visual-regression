import { describe, expect, it } from "vitest";

import { findChangedPackages, readLockfileVersions } from "../lockfiles";

const versionsOf = (file: string, contents: string) =>
  Object.fromEntries(
    [...(readLockfileVersions(file, contents) ?? new Map<string, Set<string>>())].map(
      ([name, versions]) => [name, [...versions]],
    ),
  );

describe("readLockfileVersions", () => {
  it("reads pnpm v9 packages and snapshots, including scoped names and peer suffixes", () => {
    const lock = `lockfileVersion: '9.0'

importers:
  .:
    dependencies:
      react:
        specifier: ^18.0.0
        version: 18.2.0

packages:
  '@types/react@18.2.0':
    resolution: {integrity: sha512-a}
  react@18.2.0:
    resolution: {integrity: sha512-b}

snapshots:
  '@storybook/react@8.5.0(react@18.2.0)':
    dependencies:
      react: 18.2.0
`;

    expect(versionsOf("pnpm-lock.yaml", lock)).toEqual({
      "@types/react": ["18.2.0"],
      react: ["18.2.0"],
      "@storybook/react": ["8.5.0"],
    });
  });

  it("reads pnpm v6 package keys", () => {
    const lock = `lockfileVersion: '6.0'

packages:
  /@babel/core@7.24.0:
    resolution: {integrity: sha512-a}
  /@storybook/react@8.5.0(react@18.2.0):
    resolution: {integrity: sha512-b}
`;

    expect(versionsOf("pnpm-lock.yaml", lock)).toEqual({
      "@babel/core": ["7.24.0"],
      "@storybook/react": ["8.5.0"],
    });
  });

  it("reads npm v3 packages and v1 nested dependencies", () => {
    const v3 = JSON.stringify({
      lockfileVersion: 3,
      packages: {
        "": { name: "app" },
        "apps/web": { version: "0.0.0" },
        "node_modules/react": { version: "18.2.0" },
        "node_modules/a/node_modules/@scope/b": { version: "2.0.0" },
      },
    });
    const v1 = JSON.stringify({
      lockfileVersion: 1,
      dependencies: { a: { version: "1.0.0", dependencies: { b: { version: "2.0.0" } } } },
    });

    expect(versionsOf("package-lock.json", v3)).toEqual({
      react: ["18.2.0"],
      "@scope/b": ["2.0.0"],
    });
    expect(versionsOf("npm-shrinkwrap.json", v1)).toEqual({ a: ["1.0.0"], b: ["2.0.0"] });
  });

  it("reads yarn v1 and berry entries", () => {
    const v1 = `# yarn lockfile v1

"@babel/core@^7.0.0", "@babel/core@^7.1.0":
  version "7.24.0"
  resolved "https://registry.yarnpkg.com/@babel/core/-/core-7.24.0.tgz"

react@^18.0.0:
  version "18.2.0"
`;
    const berry = `__metadata:
  version: 8

"@storybook/react@npm:^8.5.0":
  version: 8.5.0
  resolution: "@storybook/react@npm:8.5.0"
`;

    expect(versionsOf("yarn.lock", v1)).toEqual({
      "@babel/core": ["7.24.0"],
      react: ["18.2.0"],
    });
    expect(versionsOf("yarn.lock", berry)).toEqual({ "@storybook/react": ["8.5.0"] });
  });

  it("reads the text bun.lock", () => {
    const lock = `{
  "lockfileVersion": 1,
  "workspaces": { "": { "name": "app" } },
  "packages": {
    "react": ["react@18.2.0", "", {}, "sha512-a"],
    "@types/react": ["@types/react@18.2.0", "", {}, "sha512-b"],
  }
}`;

    expect(versionsOf("bun.lock", lock)).toEqual({
      react: ["18.2.0"],
      "@types/react": ["18.2.0"],
    });
  });

  it("can't read the binary bun.lockb or a lockfile it doesn't recognize", () => {
    expect(readLockfileVersions("bun.lockb", "\u0000binary")).toBeUndefined();
    expect(readLockfileVersions("pnpm-lock.yaml", "not a lockfile")).toBeUndefined();
    expect(
      readLockfileVersions(
        "pnpm-lock.yaml",
        "lockfileVersion: 5.4\npackages:\n  /clsx/2.1.1: {}\n",
      ),
    ).toBeUndefined();
  });
});

describe("findChangedPackages", () => {
  it("lists packages added, removed or moved to another version", () => {
    const base = new Map([
      ["react", new Set(["18.2.0"])],
      ["clsx", new Set(["2.1.0"])],
      ["left-pad", new Set(["1.0.0"])],
    ]);
    const current = new Map([
      ["react", new Set(["18.2.0"])],
      ["clsx", new Set(["2.1.1"])],
      ["vite", new Set(["6.0.0"])],
    ]);

    expect(findChangedPackages(base, current)).toEqual(["clsx", "left-pad", "vite"]);
  });
});
