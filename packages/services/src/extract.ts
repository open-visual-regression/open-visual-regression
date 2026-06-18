import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import * as tar from "tar";

import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { enqueueCapture } from "./lib/queue";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".txt": "text/plain",
};

export const getContentType = (filePath: string): string =>
  CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";

export const getStaticPath = (buildId: string, relativePath: string): string =>
  `builds/${buildId}/static/${relativePath}`;

export const extractBuild = async (buildId: string): Promise<void> => {
  const build = await dbClient.builds.findById(buildId);

  if (!build) {
    throw new Error(`Build not found: ${buildId}`);
  }

  const tmpDir = await mkdtemp(path.join(tmpdir(), "ovr-extract-"));
  const tarballPath = path.join(tmpDir, "artifact.tar.gz");
  const extractDir = path.join(tmpDir, "extracted");

  try {
    const artifactStream = await storage.getFileStream(build.artifactPath);
    await pipeline(artifactStream, createWriteStream(tarballPath));
    await mkdir(extractDir, { recursive: true });
    await tar.x({ file: tarballPath, cwd: extractDir, gzip: true });

    const entries = await readdir(extractDir, { recursive: true, withFileTypes: true });

    await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map((entry) => {
          const absolutePath = path.join(entry.parentPath, entry.name);
          const relativePath = path.relative(extractDir, absolutePath).split(path.sep).join("/");

          return storage.uploadFile(
            getStaticPath(buildId, relativePath),
            createReadStream(absolutePath),
            getContentType(relativePath),
          );
        }),
    );
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }

  const snapshots = await dbClient.snapshots.findByBuild(buildId);
  await Promise.all(
    snapshots.map((snapshot) => enqueueCapture({ buildId, snapshotId: snapshot.id })),
  );
};
