import type { Readable } from "node:stream";

import { DeletePrefixError, storage } from "../index";
import { describe, expect, test } from "./fixtures";

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

describe("storage", () => {
  test("uploads a file and downloads the same bytes", async ({ key }) => {
    const body = Buffer.from("fake-png-bytes");

    await storage.uploadFile(key, body, "image/png");
    const downloaded = await streamToBuffer(await storage.getFileStream(key));

    expect(downloaded).toEqual(body);
  });

  test("deleteFile removes the object", async ({ key }) => {
    await storage.uploadFile(key, Buffer.from("to-delete"), "image/png");
    await storage.deleteFile(key);

    await expect(storage.getFileStream(key)).rejects.toMatchObject({ name: "NoSuchKey" });
  });

  test("deletePrefix removes all keys with that prefix", async ({ prefix }) => {
    await storage.uploadFile(`${prefix}a.png`, Buffer.from("a"), "image/png");
    await storage.uploadFile(`${prefix}b.png`, Buffer.from("b"), "image/png");

    await storage.deletePrefix(prefix);

    await expect(storage.getFileStream(`${prefix}a.png`)).rejects.toMatchObject({
      name: "NoSuchKey",
    });
    await expect(storage.getFileStream(`${prefix}b.png`)).rejects.toMatchObject({
      name: "NoSuchKey",
    });
  });

  test("deletePrefix reports how many objects it deleted", async ({ prefix }) => {
    await storage.uploadFile(`${prefix}a.png`, Buffer.from("a"), "image/png");
    await storage.uploadFile(`${prefix}b.png`, Buffer.from("b"), "image/png");

    await expect(storage.deletePrefix(prefix)).resolves.toEqual({
      complete: true,
      deletedCount: 2,
    });
  });

  test("deletePrefix stops once its signal aborts and finishes on a later call", async ({
    prefix,
  }) => {
    await storage.uploadFile(`${prefix}a.png`, Buffer.from("a"), "image/png");

    await expect(storage.deletePrefix(prefix, { signal: AbortSignal.abort() })).resolves.toEqual({
      complete: false,
      deletedCount: 0,
    });
    expect(await storage.objectExists(`${prefix}a.png`)).toBe(true);

    await expect(storage.deletePrefix(prefix)).resolves.toEqual({
      complete: true,
      deletedCount: 1,
    });
    expect(await storage.objectExists(`${prefix}a.png`)).toBe(false);
  });

  test("deletePrefix refuses an empty prefix", async () => {
    await expect(storage.deletePrefix("")).rejects.toThrow(/empty prefix/);
  });

  test("deletePrefix deletes what it can, then throws for keys the store refused", async ({
    prefix,
    denyDeletes,
  }) => {
    const refusedKey = `${prefix}b.png`;
    await storage.uploadFile(`${prefix}a.png`, Buffer.from("a"), "image/png");
    await storage.uploadFile(refusedKey, Buffer.from("b"), "image/png");
    await denyDeletes(refusedKey);

    const error = await storage.deletePrefix(prefix).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DeletePrefixError);
    expect(error).toMatchObject({
      prefix,
      deletedCount: 1,
      failures: [{ key: refusedKey, code: "AccessDenied" }],
    });
    expect(await storage.objectExists(`${prefix}a.png`)).toBe(false);
    expect(await storage.objectExists(refusedKey)).toBe(true);
  });

  test("copyObject copies an object to a new key, leaving the source intact", async ({
    prefix,
  }) => {
    const sourceKey = `${prefix}source.png`;
    const destinationKey = `${prefix}destination.png`;
    const body = Buffer.from("fake-png-bytes");

    await storage.uploadFile(sourceKey, body, "image/png");
    await storage.copyObject(sourceKey, destinationKey);

    const copied = await streamToBuffer(await storage.getFileStream(destinationKey));
    expect(copied).toEqual(body);
    expect(await storage.objectExists(sourceKey)).toBe(true);
  });

  test("a copied object survives the source prefix being deleted", async ({ prefix }) => {
    const sourcePrefix = `${prefix}source/`;
    const sourceKey = `${sourcePrefix}artifact.tar.gz`;
    const destinationKey = `${prefix}destination/artifact.tar.gz`;
    const body = Buffer.from("tarball-bytes");

    await storage.uploadFile(sourceKey, body, "application/gzip");
    await storage.copyObject(sourceKey, destinationKey);

    await storage.deletePrefix(sourcePrefix);

    const survived = await streamToBuffer(await storage.getFileStream(destinationKey));
    expect(survived).toEqual(body);
  });

  test("getPresignedUrl returns a URL that resolves", async ({ key }) => {
    await storage.uploadFile(key, Buffer.from("presigned"), "image/png");

    const url = await storage.getPresignedUrl(key, 60);
    const response = await fetch(url);

    expect(response.status).toBe(200);
  });

  test("objectExists returns true once a key has been uploaded", async ({ key }) => {
    await storage.uploadFile(key, Buffer.from("exists"), "image/png");

    expect(await storage.objectExists(key)).toBe(true);
  });

  test("objectExists returns false for a key that was never uploaded", async ({ key }) => {
    expect(await storage.objectExists(key)).toBe(false);
  });
});
