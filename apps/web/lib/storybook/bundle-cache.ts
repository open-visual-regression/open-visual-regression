import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readdir, rename, rm, stat, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import * as tar from "tar";

import { storage } from "@ovr/storage";

const CACHE_ROOT = path.join(tmpdir(), "ovr-storybook-cache");

const parseMaxBytes = () => {
  const parsed = Number(process.env.OVR_STORYBOOK_CACHE_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2 * 1024 ** 3; // 2 GiB
};

const MAX_CACHE_BYTES = parseMaxBytes();

// Single-flight per build within this process. Concurrent first-requests for the
// same build share one extraction instead of racing (cross-process, the atomic
// rename below means the loser simply serves the winner's copy).
const inflight = new Map<string, Promise<string>>();

const directorySize = async (dir: string): Promise<number> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return directorySize(fullPath);
      return stat(fullPath)
        .then((stats) => stats.size)
        .catch(() => 0);
    }),
  );
  return sizes.reduce((total, size) => total + size, 0);
};

// Best-effort LRU eviction: while the cache is over its byte cap, drop the
// least-recently-touched build directories. Runs only after a cold extraction.
const evictIfOverCap = async (keep: string): Promise<void> => {
  try {
    const names = await readdir(CACHE_ROOT);
    const dirs = await Promise.all(
      names.map(async (name) => {
        const fullPath = path.join(CACHE_ROOT, name);
        const stats = await stat(fullPath).catch(() => null);
        if (!stats?.isDirectory()) return null;
        return { fullPath, mtimeMs: stats.mtimeMs, size: await directorySize(fullPath) };
      }),
    );

    const present = dirs.filter((dir): dir is NonNullable<typeof dir> => dir !== null);
    let total = present.reduce((sum, dir) => sum + dir.size, 0);

    for (const dir of present.sort((a, b) => a.mtimeMs - b.mtimeMs)) {
      if (total <= MAX_CACHE_BYTES) break;
      if (dir.fullPath === keep) continue;
      await rm(dir.fullPath, { recursive: true, force: true }).catch(() => {});
      total -= dir.size;
    }
  } catch {
    // Eviction is best-effort; never fail a request because cleanup failed.
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

    // Publish atomically. If another process already published this build, the
    // rename fails and we simply use the existing copy.
    try {
      await rename(stagingDir, bundleDir);
    } catch {
      const stats = await stat(bundleDir).catch(() => null);
      if (!stats?.isDirectory()) throw new Error(`Failed to publish bundle for build ${buildId}`);
    }

    void evictIfOverCap(bundleDir);
    return bundleDir;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
};

/**
 * Returns a local directory containing the build's unpacked Storybook bundle,
 * materializing it from the artifact tarball on a cache miss. The directory is
 * only ever published complete (atomic rename), so its presence implies it is
 * ready to serve.
 */
export const getBundleDir = async (buildId: string, artifactPath: string): Promise<string> => {
  await mkdir(CACHE_ROOT, { recursive: true });

  const bundleDir = path.join(CACHE_ROOT, buildId);

  const cached = await stat(bundleDir).catch(() => null);
  if (cached?.isDirectory()) {
    await utimes(bundleDir, new Date(), new Date()).catch(() => {}); // mark recently used
    return bundleDir;
  }

  const existing = inflight.get(buildId);
  if (existing) return existing;

  const job = materialize(buildId, artifactPath, bundleDir).finally(() => inflight.delete(buildId));
  inflight.set(buildId, job);
  return job;
};
