import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

import { runMigrations } from "@ovr/db/migrate";

let container: StartedPostgreSqlContainer;

export async function setup() {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  process.env.DATABASE_URL = container.getConnectionUri();
  await runMigrations(process.env.DATABASE_URL);
}

export async function teardown() {
  await container?.stop();
}
