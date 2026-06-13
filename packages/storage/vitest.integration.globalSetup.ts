import { createBucket, startRustfs, type RustfsContainer } from "@ovr/testing";

let rustfs: RustfsContainer;

export async function setup() {
  rustfs = await startRustfs();

  process.env.STORAGE_ENDPOINT = rustfs.endpoint;
  process.env.STORAGE_ACCESS_KEY = rustfs.accessKey;
  process.env.STORAGE_SECRET_KEY = rustfs.secretKey;
  process.env.STORAGE_BUCKET = "ovr";
  process.env.STORAGE_REGION = "us-east-1";

  await createBucket(rustfs, "ovr");
}

export async function teardown() {
  await rustfs?.stop();
}
