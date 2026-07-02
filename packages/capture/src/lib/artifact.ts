import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import * as tar from "tar";

import { storage } from "@ovr/storage";

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
