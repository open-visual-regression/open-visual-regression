import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

import { runMigrations } from "@ovr/db/migrate";
import { createBucket, startRustfs, type RustfsContainer } from "@ovr/testing";

let postgres: StartedPostgreSqlContainer;
let rustfs: RustfsContainer;

export async function setup() {
  postgres = await new PostgreSqlContainer("postgres:16-alpine").start();
  process.env.DATABASE_URL = postgres.getConnectionUri();
  await runMigrations(process.env.DATABASE_URL);

  rustfs = await startRustfs();
  process.env.STORAGE_ENDPOINT = rustfs.endpoint;
  process.env.STORAGE_ACCESS_KEY = rustfs.accessKey;
  process.env.STORAGE_SECRET_KEY = rustfs.secretKey;
  process.env.STORAGE_BUCKET = "ovr";
  process.env.STORAGE_REGION = "us-east-1";

  await createBucket(rustfs, "ovr");
}

export async function teardown() {
  await postgres?.stop();
  await rustfs?.stop();
}
