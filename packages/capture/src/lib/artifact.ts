import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import * as tar from "tar";

import { storage } from "@ovr/storage";

// Downloads and unpacks a build's artifact tarball into a throwaway local directory,
// runs `fn` against it, then removes the directory. The unpacked bundle is served off
// local disk during capture, so the whole Storybook bundle is fetched from storage once
// per job instead of one storage request per asset per snapshot.
export const withExtractedBundle = async <T>(
  artifactPath: string,
  fn: (bundleDir: string) => Promise<T>,
): Promise<T> => {
  const workDir = await mkdtemp(path.join(tmpdir(), "ovr-bundle-"));
  const tarballPath = path.join(workDir, "artifact.tar.gz");
  const bundleDir = path.join(workDir, "bundle");

  try {
    const artifactStream = await storage.getFileStream(artifactPath);
    await pipeline(artifactStream, createWriteStream(tarballPath));
    await mkdir(bundleDir, { recursive: true });
    await tar.x({ file: tarballPath, cwd: bundleDir, gzip: true });

    return await fn(bundleDir);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
};
