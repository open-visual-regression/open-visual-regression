import type { Readable } from "node:stream";

import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { deleteFile, deletePrefix, getFileStream, getPresignedUrl, uploadFile } from "../../index";
import { startRustfs, type RustfsContainer } from "../helpers/containers";

let rustfs: RustfsContainer;

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

beforeAll(async () => {
  rustfs = await startRustfs();

  process.env.STORAGE_ENDPOINT = rustfs.endpoint;
  process.env.STORAGE_ACCESS_KEY = rustfs.accessKey;
  process.env.STORAGE_SECRET_KEY = rustfs.secretKey;
  process.env.STORAGE_BUCKET = "ovr";
  process.env.STORAGE_REGION = "us-east-1";

  const client = new S3Client({
    endpoint: rustfs.endpoint,
    region: "us-east-1",
    credentials: { accessKeyId: rustfs.accessKey, secretAccessKey: rustfs.secretKey },
    forcePathStyle: true,
  });
  await client.send(new CreateBucketCommand({ Bucket: "ovr" }));
}, 120_000);

afterAll(async () => {
  await rustfs.stop();
});

describe("storage", () => {
  test("uploads a file and downloads the same bytes", async () => {
    const body = Buffer.from("fake-png-bytes");

    await uploadFile("test/upload.png", body, "image/png");
    const downloaded = await streamToBuffer(await getFileStream("test/upload.png"));

    expect(downloaded).toEqual(body);
  });

  test("deleteFile removes the object", async () => {
    await uploadFile("test/delete.png", Buffer.from("to-delete"), "image/png");
    await deleteFile("test/delete.png");

    await expect(getFileStream("test/delete.png")).rejects.toMatchObject({ name: "NoSuchKey" });
  });

  test("deletePrefix removes all keys with that prefix", async () => {
    await uploadFile("test/prefix/a.png", Buffer.from("a"), "image/png");
    await uploadFile("test/prefix/b.png", Buffer.from("b"), "image/png");

    await deletePrefix("test/prefix/");

    await expect(getFileStream("test/prefix/a.png")).rejects.toMatchObject({ name: "NoSuchKey" });
    await expect(getFileStream("test/prefix/b.png")).rejects.toMatchObject({ name: "NoSuchKey" });
  });

  test("getPresignedUrl returns a URL that resolves", async () => {
    await uploadFile("test/presigned.png", Buffer.from("presigned"), "image/png");

    const url = await getPresignedUrl("test/presigned.png", 60);
    const response = await fetch(url);

    expect(response.status).toBe(200);
  });
});
