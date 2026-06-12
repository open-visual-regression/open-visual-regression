import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

import { runMigrations } from "@ovr/db/migrate";

import {
  startRustfs,
  startValkey,
  type RustfsContainer,
  type ValkeyContainer,
} from "./src/__tests__/helpers/containers";

let postgres: StartedPostgreSqlContainer;
let rustfs: RustfsContainer;
let valkey: ValkeyContainer;

export async function setup() {
  [postgres, rustfs, valkey] = await Promise.all([
    new PostgreSqlContainer("postgres:16-alpine").start(),
    startRustfs(),
    startValkey(),
  ]);

  process.env.DATABASE_URL = postgres.getConnectionUri();
  await runMigrations(process.env.DATABASE_URL);

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

  process.env.VALKEY_URL = `redis://${valkey.host}:${valkey.port}`;
}

export async function teardown() {
  await postgres?.stop();
  await rustfs?.stop();
  await valkey?.stop();
}
