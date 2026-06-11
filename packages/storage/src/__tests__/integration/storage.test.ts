import type { Readable } from "node:stream";

import { describe, expect, test } from "vitest";

import { storage } from "../../index";

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

describe("storage", () => {
  test("uploads a file and downloads the same bytes", async () => {
    const body = Buffer.from("fake-png-bytes");

    await storage.uploadFile("test/upload.png", body, "image/png");
    const downloaded = await streamToBuffer(await storage.getFileStream("test/upload.png"));

    expect(downloaded).toEqual(body);
  });

  test("deleteFile removes the object", async () => {
    await storage.uploadFile("test/delete.png", Buffer.from("to-delete"), "image/png");
    await storage.deleteFile("test/delete.png");

    await expect(storage.getFileStream("test/delete.png")).rejects.toMatchObject({
      name: "NoSuchKey",
    });
  });

  test("deletePrefix removes all keys with that prefix", async () => {
    await storage.uploadFile("test/prefix/a.png", Buffer.from("a"), "image/png");
    await storage.uploadFile("test/prefix/b.png", Buffer.from("b"), "image/png");

    await storage.deletePrefix("test/prefix/");

    await expect(storage.getFileStream("test/prefix/a.png")).rejects.toMatchObject({
      name: "NoSuchKey",
    });
    await expect(storage.getFileStream("test/prefix/b.png")).rejects.toMatchObject({
      name: "NoSuchKey",
    });
  });

  test("getPresignedUrl returns a URL that resolves", async () => {
    await storage.uploadFile("test/presigned.png", Buffer.from("presigned"), "image/png");

    const url = await storage.getPresignedUrl("test/presigned.png", 60);
    const response = await fetch(url);

    expect(response.status).toBe(200);
  });
});
