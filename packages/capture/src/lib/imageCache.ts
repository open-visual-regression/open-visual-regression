import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { LRUCache } from "lru-cache";

import { createLogger } from "@ovr/logger";
import { storage } from "@ovr/storage";

const logger = createLogger("image-cache");

const IMAGE_READ_TIMEOUT_MS = 30_000;

const cacheRoot = (): string => path.join(tmpdir(), "ovr-image-cache");

const maxCacheBytes = (): number => {
  const parsed = Number(process.env.OVR_IMAGE_CACHE_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 512 * 1024 ** 2;
};

type CachedImage = { filePath: string; size: number };

type ImageIndex = {
  root: string;
  entries: LRUCache<string, CachedImage>;
  ready: Promise<void>;
};

let index: ImageIndex | undefined;

const getIndex = (): ImageIndex => {
  const root = cacheRoot();

  if (index?.root !== root) {
    index = {
      root,
      entries: new LRUCache<string, CachedImage>({
        maxSize: maxCacheBytes(),
        sizeCalculation: (image) => image.size,
        dispose: (image) => {
          rm(image.filePath, { force: true }).catch((err: unknown) => {
            logger.warn({ err, filePath: image.filePath }, "failed to evict cached image");
          });
        },
      }),
      ready: rm(root, { recursive: true, force: true })
        .then(() => mkdir(root, { recursive: true }))
        .then(() => undefined),
    };
  }

  return index;
};

export const cacheImage = async (imagePath: string, image: Buffer): Promise<void> => {
  const { root, entries, ready } = getIndex();
  if (image.length > entries.maxSize) {
    return;
  }

  const filePath = path.join(root, `${randomUUID()}.png`);

  try {
    await ready;
    await writeFile(filePath, image);
    entries.set(imagePath, { filePath, size: image.length });
  } catch (err) {
    logger.warn({ err, imagePath }, "failed to cache image");
    await rm(filePath, { force: true }).catch(() => undefined);
  }
};

const downloadImage = async (imagePath: string): Promise<Buffer> => {
  const stream = await storage.getFileStream(imagePath);
  const timeout = setTimeout(() => {
    stream.destroy(new Error(`Timed out reading image: ${imagePath}`));
  }, IMAGE_READ_TIMEOUT_MS);

  try {
    return Buffer.concat(await stream.toArray());
  } finally {
    clearTimeout(timeout);
  }
};

export const readImage = async (imagePath: string): Promise<{ image: Buffer; cached: boolean }> => {
  const { entries, ready } = getIndex();
  await ready.catch(() => undefined);

  const cached = entries.get(imagePath);
  const image = cached && (await readFile(cached.filePath).catch(() => null));
  if (image) {
    return { image, cached: true };
  }

  const downloaded = await downloadImage(imagePath);
  await cacheImage(imagePath, downloaded);
  return { image: downloaded, cached: false };
};
