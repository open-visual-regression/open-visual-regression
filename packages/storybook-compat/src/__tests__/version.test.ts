import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  MINIMUM_STORYBOOK_VERSION,
  UnsupportedStorybookVersionError,
  assertSupportedStorybookBuild,
  isSupportedStorybookVersion,
  readStorybookBuildVersion,
} from "../version";

const directories: string[] = [];

const writeBuild = async ({
  storybookVersion,
  indexVersion,
}: {
  storybookVersion?: string;
  indexVersion?: number;
}): Promise<string> => {
  const dir = await mkdtemp(path.join(tmpdir(), "ovr-storybook-version-"));
  directories.push(dir);

  if (indexVersion !== undefined) {
    await writeFile(path.join(dir, "index.json"), JSON.stringify({ v: indexVersion, entries: {} }));
  }
  if (storybookVersion !== undefined) {
    await writeFile(path.join(dir, "project.json"), JSON.stringify({ storybookVersion }));
  }

  return dir;
};

afterEach(async () => {
  await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("isSupportedStorybookVersion", () => {
  it.each([
    ["8.5.0", true],
    ["8.5.8", true],
    ["8.6.14", true],
    ["9.1.20", true],
    ["10.5.10", true],
    ["8.4.7", false],
    ["8.0.0", false],
    ["7.6.20", false],
    ["6.5.16", false],
  ])("treats %s as supported=%s", (version, supported) => {
    expect(isSupportedStorybookVersion(version)).toBe(supported);
  });

  it("compares the release numbers rather than the string, so 10 beats 9", () => {
    expect(isSupportedStorybookVersion("10.0.0")).toBe(true);
  });

  it("ignores prerelease suffixes so Storybook prereleases are not turned away", () => {
    expect(isSupportedStorybookVersion("11.0.0-alpha.1")).toBe(true);
    expect(isSupportedStorybookVersion("8.4.0-beta.2")).toBe(false);
  });
});

describe("readStorybookBuildVersion", () => {
  it("reads the exact version from project.json and the manifest version from index.json", async () => {
    const dir = await writeBuild({ storybookVersion: "9.1.20", indexVersion: 5 });

    expect(await readStorybookBuildVersion(dir)).toEqual({ version: "9.1.20", indexVersion: 5 });
  });

  it("reports nothing for a directory that is not a Storybook build", async () => {
    const dir = await writeBuild({});

    expect(await readStorybookBuildVersion(dir)).toEqual({
      version: undefined,
      indexVersion: undefined,
    });
  });
});

describe("assertSupportedStorybookBuild", () => {
  it("accepts a build at the exact minimum", async () => {
    const dir = await writeBuild({ storybookVersion: MINIMUM_STORYBOOK_VERSION, indexVersion: 5 });

    await expect(assertSupportedStorybookBuild(dir)).resolves.toMatchObject({
      version: MINIMUM_STORYBOOK_VERSION,
    });
  });

  it("rejects a build below the minimum, naming the version it found", async () => {
    const dir = await writeBuild({ storybookVersion: "8.4.7", indexVersion: 5 });

    await expect(assertSupportedStorybookBuild(dir)).rejects.toThrow(
      /Storybook 8\.4\.7.*requires Storybook 8\.5\.0 or newer/s,
    );
    await expect(assertSupportedStorybookBuild(dir)).rejects.toBeInstanceOf(
      UnsupportedStorybookVersionError,
    );
  });

  // Storybook 7 is the one version we can still recognise without project.json,
  // because it is the only supported-era major that writes index.json v4.
  it("rejects a Storybook 7 build from the manifest version alone", async () => {
    const dir = await writeBuild({ indexVersion: 4 });

    await expect(assertSupportedStorybookBuild(dir)).rejects.toThrow(
      /looks like a Storybook 7 build \(index\.json v4\)/,
    );
  });

  it("accepts a build whose version it cannot place, leaving the manifest parser to complain", async () => {
    const dir = await writeBuild({ indexVersion: 5 });

    await expect(assertSupportedStorybookBuild(dir)).resolves.toEqual({
      version: undefined,
      indexVersion: 5,
    });
  });

  it("prefers project.json over the manifest version", async () => {
    const dir = await writeBuild({ storybookVersion: "10.5.10", indexVersion: 4 });

    await expect(assertSupportedStorybookBuild(dir)).resolves.toMatchObject({
      version: "10.5.10",
    });
  });
});
