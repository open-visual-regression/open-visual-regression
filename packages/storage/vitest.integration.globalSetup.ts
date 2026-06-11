import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";

import { startRustfs, type RustfsContainer } from "./src/__tests__/helpers/containers";

let rustfs: RustfsContainer;

export async function setup() {
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
}

export async function teardown() {
  await rustfs?.stop();
}
