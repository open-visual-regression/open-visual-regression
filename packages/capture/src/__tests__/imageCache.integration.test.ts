import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { v7 as uuidv7 } from "uuid";
import { describe, expect, test, vi } from "vitest";

import { storage } from "@ovr/storage";

import { cacheImage, readImage } from "../lib/imageCache";

const REAL_TMPDIR = tmpdir();

const cacheOnItsOwnDiskWithCap = async (maxBytes: number): Promise<void> => {
  vi.stubEnv("TMPDIR", await mkdtemp(path.join(REAL_TMPDIR, "ovr-image-cache-home-")));
  vi.stubEnv("OVR_IMAGE_CACHE_BYTES", String(maxBytes));
};

const uploadImage = async (contents: string): Promise<string> => {
  const imagePath = `${uuidv7()}/snapshots/${uuidv7()}.png`;
  await storage.uploadFile(imagePath, Buffer.from(contents), "image/png");
  return imagePath;
};

describe("imageCache", () => {
  test("downloads an image once, however many times it is read", async () => {
    await cacheOnItsOwnDiskWithCap(1024);
    const imagePath = await uploadImage("baseline");

    const download = vi.spyOn(storage, "getFileStream");

    const images = [await readImage(imagePath), await readImage(imagePath)];

    expect(images.map(String)).toEqual(["baseline", "baseline"]);
    expect(download).toHaveBeenCalledTimes(1);
  });

  test("reads an image it was handed after uploading it without downloading it", async () => {
    await cacheOnItsOwnDiskWithCap(1024);
    const imagePath = await uploadImage("capture");

    const download = vi.spyOn(storage, "getFileStream");

    await cacheImage(imagePath, Buffer.from("capture"));

    expect(String(await readImage(imagePath))).toBe("capture");
    expect(download).not.toHaveBeenCalled();
  });

  test("downloads an image again once newer images have pushed it out of the cache", async () => {
    await cacheOnItsOwnDiskWithCap(12);
    const olderPath = await uploadImage("older-1");
    const newerPath = await uploadImage("newer-1");

    await readImage(olderPath);
    await readImage(newerPath);

    const download = vi.spyOn(storage, "getFileStream");

    expect(String(await readImage(newerPath))).toBe("newer-1");
    expect(download).not.toHaveBeenCalled();
    expect(String(await readImage(olderPath))).toBe("older-1");
    expect(download).toHaveBeenCalledExactlyOnceWith(olderPath);
  });
});
