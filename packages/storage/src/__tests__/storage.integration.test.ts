import type { Readable } from "node:stream";

import { storage } from "../index";
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

  test("getPresignedUrl returns a URL that resolves", async ({ key }) => {
    await storage.uploadFile(key, Buffer.from("presigned"), "image/png");

    const url = await storage.getPresignedUrl(key, 60);
    const response = await fetch(url);

    expect(response.status).toBe(200);
  });
});
