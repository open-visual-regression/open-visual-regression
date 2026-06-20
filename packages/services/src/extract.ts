import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import * as tar from "tar";

import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { enqueueCapture } from "./lib/queue";
import { getContentType, getStaticPath } from "./lib/staticFiles";
import { readStoryViewportOverrides, resolveTargetViewports } from "./storyViewports";
import type { NamedViewport } from "./storyViewports";

export { getContentType, getStaticPath };

type Target = { id: string; title: string; name: string };

export const extractBuild = async (
  buildId: string,
  targets: Target[],
  viewports: NamedViewport[],
): Promise<void> => {
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

  const overridesByTarget = await readStoryViewportOverrides(
    buildId,
    targets.map((target) => target.id),
  );

  await dbClient.snapshots.createMany({
    values: targets.flatMap((target) =>
      resolveTargetViewports(viewports, overridesByTarget.get(target.id)).map((viewport) => ({
        buildId,
        browser: viewport.browser,
        viewportWidth: viewport.viewportWidth,
        viewportHeight: viewport.viewportHeight ?? 0,
        targetId: target.id,
        targetTitle: target.title,
        targetName: target.name,
        status: "pending" as const,
      })),
    ),
  });

  const snapshots = await dbClient.snapshots.findByBuild(buildId);
  await Promise.all(
    snapshots.map((snapshot) => enqueueCapture({ buildId, snapshotId: snapshot.id })),
  );
};
