import path from "node:path";

import { readMigrationFiles, type MigrationMeta } from "drizzle-orm/migrator";
import { Client, DatabaseError } from "pg";

// drizzle's own table, so either migrator can run against the same database.
const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = `"${MIGRATIONS_SCHEMA}"."__drizzle_migrations"`;

const MIGRATION_LOCK_KEY = 7_315_420_118;

// While a migration waits for a lock, every new query on that table queues behind it.
const LOCK_TIMEOUT_MS = 5_000;
const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 1_000;

// lock_not_available and deadlock_detected
const RETRYABLE_ERROR_CODES = new Set(["55P03", "40P01"]);

type RunMigrationsOptions = {
  lockTimeoutMs?: number;
  maxAttempts?: number;
  retryDelayMs?: number;
};

// For statements like CREATE INDEX CONCURRENTLY. These migrations must be safe to rerun.
const NO_TRANSACTION_MARKER = "-- ovr:no-transaction";

const recordMigration = (client: Client, migration: MigrationMeta) =>
  client.query(`INSERT INTO ${MIGRATIONS_TABLE} (hash, created_at) VALUES ($1, $2)`, [
    migration.hash,
    migration.folderMillis,
  ]);

const applyMigrationInTransaction = async (
  client: Client,
  migration: MigrationMeta,
  lockTimeoutMs: number,
) => {
  await client.query("BEGIN");
  try {
    await client.query(`SET LOCAL lock_timeout = ${lockTimeoutMs}`);
    for (const statement of migration.sql) {
      await client.query(statement);
    }
    await recordMigration(client, migration);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
};

const applyMigrationWithoutTransaction = async (
  client: Client,
  migration: MigrationMeta,
  lockTimeoutMs: number,
) => {
  await client.query(`SET lock_timeout = ${lockTimeoutMs}`);
  try {
    for (const statement of migration.sql) {
      await client.query(statement);
    }
    await recordMigration(client, migration);
  } finally {
    await client.query("RESET lock_timeout");
  }
};

const applyMigration = (client: Client, migration: MigrationMeta, lockTimeoutMs: number) =>
  migration.sql[0]?.trimStart().startsWith(NO_TRANSACTION_MARKER)
    ? applyMigrationWithoutTransaction(client, migration, lockTimeoutMs)
    : applyMigrationInTransaction(client, migration, lockTimeoutMs);

// drizzle's migrate() applies all pending migrations in one transaction, which
// deadlocks with the running app when an upgrade spans several migrations.
export const runMigrations = async (
  connectionString: string,
  migrationsFolder: string = path.resolve(import.meta.dirname, "migrations"),
  {
    lockTimeoutMs = LOCK_TIMEOUT_MS,
    maxAttempts = MAX_ATTEMPTS,
    retryDelayMs = RETRY_DELAY_MS,
  }: RunMigrationsOptions = {},
) => {
  const migrations = readMigrationFiles({ migrationsFolder });
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);

    await client.query(`CREATE SCHEMA IF NOT EXISTS "${MIGRATIONS_SCHEMA}"`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const { rows } = await client.query<{ created_at: string }>(
      `SELECT created_at FROM ${MIGRATIONS_TABLE} ORDER BY created_at DESC LIMIT 1`,
    );
    const lastAppliedAt = rows[0] ? Number(rows[0].created_at) : undefined;

    for (const migration of migrations) {
      if (lastAppliedAt !== undefined && lastAppliedAt >= migration.folderMillis) {
        continue;
      }

      for (let attempt = 1; ; attempt++) {
        try {
          await applyMigration(client, migration, lockTimeoutMs);
          break;
        } catch (error) {
          const retryable =
            error instanceof DatabaseError && RETRYABLE_ERROR_CODES.has(error.code ?? "");
          if (!retryable || attempt >= maxAttempts) {
            throw error;
          }

          console.warn(
            `Migration ${migration.folderMillis} could not get its locks (attempt ${attempt}), retrying: ${error.message}`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
        }
      }
    }
  } finally {
    await client.end();
  }
};
