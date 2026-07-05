import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

import { runMigrations } from "@ovr/db/migrate";
import { startValkey, type ValkeyContainer } from "@ovr/testing";

let postgres: StartedPostgreSqlContainer;
let valkey: ValkeyContainer;

export async function setup() {
  [postgres, valkey] = await Promise.all([
    new PostgreSqlContainer("postgres:16-alpine").start(),
    startValkey(),
  ]);

  process.env.DATABASE_URL = postgres.getConnectionUri();
  await runMigrations(process.env.DATABASE_URL);

  process.env.REDIS_URL = `redis://${valkey.host}:${valkey.port}`;
}

export async function teardown() {
  await postgres?.stop();
  await valkey?.stop();
}
