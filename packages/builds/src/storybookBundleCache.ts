import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readdir, rename, rm, stat, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import * as tar from "tar";

import { createLogger } from "@ovr/logger";
import { storage } from "@ovr/storage";

const logger = createLogger("storybook-cache");

const CACHE_ROOT = path.join(tmpdir(), "ovr-storybook-cache");

const parseMaxBytes = () => {
  const parsed = Number(process.env.OVR_STORYBOOK_CACHE_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2 * 1024 ** 3;
};

const MAX_CACHE_BYTES = parseMaxBytes();

const inflight = new Map<string, Promise<string>>();

const statOrNull = (target: string) => stat(target).catch(() => null);

const directorySize = async (dir: string): Promise<number> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return directorySize(fullPath);
      }
      return (await statOrNull(fullPath))?.size ?? 0;
    }),
  );
  return sizes.reduce((total, size) => total + size, 0);
};

const evictIfOverCap = async (keep: string): Promise<void> => {
  try {
    const names = await readdir(CACHE_ROOT);
    const dirs = await Promise.all(
      names.map(async (name) => {
        const fullPath = path.join(CACHE_ROOT, name);
        const stats = await statOrNull(fullPath);
        if (!stats?.isDirectory()) {
          return null;
        }
        return { fullPath, mtimeMs: stats.mtimeMs, size: await directorySize(fullPath) };
      }),
    );

    const present = dirs.filter((dir): dir is NonNullable<typeof dir> => dir !== null);
    let total = present.reduce((sum, dir) => sum + dir.size, 0);

    for (const dir of present.sort((a, b) => a.mtimeMs - b.mtimeMs)) {
      if (total <= MAX_CACHE_BYTES) {
        break;
      }
      if (dir.fullPath === keep) {
        continue;
      }
      await rm(dir.fullPath, { recursive: true, force: true }).catch((err: unknown) => {
        logger.warn({ err, dir: dir.fullPath }, "failed to evict cached storybook bundle");
      });
      total -= dir.size;
    }
  } catch (err) {
    logger.warn({ err }, "storybook bundle cache eviction failed");
  }
};

const materialize = async (
  buildId: string,
  artifactPath: string,
  bundleDir: string,
): Promise<string> => {
  const workDir = await mkdtemp(path.join(CACHE_ROOT, `${buildId}-`));
  const tarballPath = path.join(workDir, "artifact.tar.gz");
  const stagingDir = path.join(workDir, "bundle");

  try {
    const artifactStream = await storage.getFileStream(artifactPath);
    await pipeline(artifactStream, createWriteStream(tarballPath));
    await mkdir(stagingDir, { recursive: true });
    await tar.x({ file: tarballPath, cwd: stagingDir, gzip: true });

    try {
      await rename(stagingDir, bundleDir);
    } catch {
      const stats = await statOrNull(bundleDir);
      if (!stats?.isDirectory()) {
        throw new Error(`Failed to publish bundle for build ${buildId}`);
      }
    }

    void evictIfOverCap(bundleDir);
    return bundleDir;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch((err: unknown) => {
      logger.warn({ err, workDir }, "failed to remove storybook extraction temp dir");
    });
  }
};

export const getBundleDir = async (buildId: string, artifactPath: string): Promise<string> => {
  await mkdir(CACHE_ROOT, { recursive: true });

  const bundleDir = path.join(CACHE_ROOT, buildId);

  const cached = await statOrNull(bundleDir);
  if (cached?.isDirectory()) {
    await utimes(bundleDir, new Date(), new Date()).catch((err: unknown) => {
      logger.debug({ err, bundleDir }, "failed to bump storybook bundle mtime");
    });
    return bundleDir;
  }

  const existing = inflight.get(buildId);
  if (existing) {
    return existing;
  }

  const job = materialize(buildId, artifactPath, bundleDir).finally(() => inflight.delete(buildId));
  inflight.set(buildId, job);
  return job;
};
