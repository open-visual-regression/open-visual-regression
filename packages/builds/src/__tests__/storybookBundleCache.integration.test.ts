import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import * as tar from "tar";
import { v7 as uuidv7 } from "uuid";
import { describe, expect, test, vi } from "vitest";

import { storage } from "@ovr/storage";

import { getBundleDir, withBundleDir } from "../storybookBundleCache";

const REAL_TMPDIR = tmpdir();

const uploadBundle = async (artifactPath: string, marker: string): Promise<void> => {
  const sourceDir = await mkdtemp(path.join(REAL_TMPDIR, "ovr-bundle-fixture-"));
  const tarballPath = `${sourceDir}.tar.gz`;

  try {
    await writeFile(path.join(sourceDir, "iframe.html"), marker);
    await tar.create({ gzip: true, file: tarballPath, cwd: sourceDir }, ["."]);
    await storage.uploadFile(artifactPath, await readFile(tarballPath), "application/gzip");
  } finally {
    await rm(sourceDir, { recursive: true, force: true });
    await rm(tarballPath, { force: true });
  }
};

const readMarker = (bundleDir: string): Promise<string> =>
  readFile(path.join(bundleDir, "iframe.html"), "utf-8");

const cacheOnItsOwnDiskWithCap = async (maxBytes: number): Promise<void> => {
  vi.stubEnv("TMPDIR", await mkdtemp(path.join(REAL_TMPDIR, "ovr-cache-home-")));
  vi.stubEnv("OVR_STORYBOOK_CACHE_BYTES", String(maxBytes));
};

describe("storybookBundleCache", () => {
  describe("withBundleDir", () => {
    test("downloads a build's storybook bundle once, however many capture groups ask for it", async () => {
      const buildId = uuidv7();
      const artifactPath = `${uuidv7()}/artifact.tar.gz`;
      await uploadBundle(artifactPath, "story-a");

      const download = vi.spyOn(storage, "getFileStream");

      const markers = [
        await withBundleDir(buildId, artifactPath, readMarker),
        await withBundleDir(buildId, artifactPath, readMarker),
        await withBundleDir(buildId, artifactPath, readMarker),
      ];

      expect(markers).toEqual(["story-a", "story-a", "story-a"]);
      expect(download).toHaveBeenCalledTimes(1);
    });

    test("downloads a build's storybook bundle once when capture groups start together", async () => {
      const buildId = uuidv7();
      const artifactPath = `${uuidv7()}/artifact.tar.gz`;
      await uploadBundle(artifactPath, "story-a");

      const download = vi.spyOn(storage, "getFileStream");

      const markers = await Promise.all([
        withBundleDir(buildId, artifactPath, readMarker),
        withBundleDir(buildId, artifactPath, readMarker),
        withBundleDir(buildId, artifactPath, readMarker),
      ]);

      expect(markers).toEqual(["story-a", "story-a", "story-a"]);
      expect(download).toHaveBeenCalledTimes(1);
    });

    test("keeps serving a bundle that is still in use when another build overflows the cache", async () => {
      await cacheOnItsOwnDiskWithCap(1);

      const artifactPath = `${uuidv7()}/artifact.tar.gz`;
      await uploadBundle(artifactPath, "story-a");

      const idle = await getBundleDir(uuidv7(), artifactPath);

      await withBundleDir(uuidv7(), artifactPath, async (inUse) => {
        await getBundleDir(uuidv7(), artifactPath);

        expect(existsSync(idle)).toBe(false);
        expect(existsSync(inUse)).toBe(true);
        expect(await readMarker(inUse)).toBe("story-a");
      });
    });
  });

  describe("getBundleDir", () => {
    test("re-downloads a bundle that was evicted after its build finished", async () => {
      const buildId = uuidv7();
      const artifactPath = `${uuidv7()}/artifact.tar.gz`;
      await uploadBundle(artifactPath, "story-a");

      const bundleDir = await getBundleDir(buildId, artifactPath);
      await rm(bundleDir, { recursive: true, force: true });

      expect(await readMarker(await getBundleDir(buildId, artifactPath))).toBe("story-a");
    });
  });
});
