import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import ky from "ky";
import * as tar from "tar";

export const createArtifactTarball = async (dir: string): Promise<Buffer> => {
  const tmpDir = await mkdtemp(path.join(tmpdir(), "ovr-"));
  const tarballPath = path.join(tmpDir, "artifact.tar.gz");

  try {
    await tar.create({ gzip: true, file: tarballPath, cwd: dir }, ["."]);
    return await readFile(tarballPath);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
};

export const uploadArtifact = async (uploadUrl: string, artifact: Buffer): Promise<void> => {
  await ky.put(uploadUrl, {
    body: new Uint8Array(artifact),
    headers: { "Content-Type": "application/gzip" },
    retry: { limit: 3 },
  });
};
