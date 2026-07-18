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
let valkey: ValkeyContainer;
let rustfs: RustfsContainer;

export async function setup() {
  [postgres, valkey, rustfs] = await Promise.all([
    new PostgreSqlContainer("postgres:16-alpine").start(),
    startValkey(),
    startRustfs(),
  ]);

  process.env.DATABASE_URL = postgres.getConnectionUri();
  await runMigrations(process.env.DATABASE_URL);

  process.env.REDIS_URL = `redis://${valkey.host}:${valkey.port}`;

  process.env.STORAGE_ENDPOINT = rustfs.endpoint;
  process.env.STORAGE_ACCESS_KEY = rustfs.accessKey;
  process.env.STORAGE_SECRET_KEY = rustfs.secretKey;
  process.env.STORAGE_BUCKET = "ovr";
  process.env.STORAGE_REGION = "us-east-1";
  await createBucket(rustfs, "ovr");
}

export async function teardown() {
  await Promise.all([postgres?.stop(), valkey?.stop(), rustfs?.stop()]);
}
