import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

import { runMigrations } from "@ovr/db/migrate";
import {
  createBucket,
  startRustfs,
  startValkey,
  type RustfsContainer,
  type ValkeyContainer,
} from "@ovr/testing";

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

  await createBucket(rustfs, "ovr");

  process.env.REDIS_URL = `redis://${valkey.host}:${valkey.port}`;

  process.env.OVR_GIT_TOKEN_ENCRYPTION_KEY = Buffer.from("0".repeat(32), "utf8").toString("base64");
}

export async function teardown() {
  await postgres?.stop();
  await rustfs?.stop();
  await valkey?.stop();
}
