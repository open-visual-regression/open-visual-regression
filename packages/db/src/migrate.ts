import path from "node:path";

import { readMigrationFiles, type MigrationMeta } from "drizzle-orm/migrator";
import { Client, DatabaseError } from "pg";

import { createLogger } from "@ovr/logger";

const logger = createLogger("migrate");

// Same bookkeeping table as drizzle's migrator, so databases migrated by either
// one are interchangeable.
const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = `"${MIGRATIONS_SCHEMA}"."__drizzle_migrations"`;

// Arbitrary key for the advisory lock that keeps two migrators from running at
// once (for example a retried Job overlapping the previous attempt).
const MIGRATION_LOCK_KEY = 7_315_420_118;

// Postgres queues every new query on a table behind a pending lock request, so
// a migration waiting indefinitely for a lock stalls the running app with it.
// Give up after a few seconds instead and retry the migration.
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

const applyMigration = async (client: Client, migration: MigrationMeta, lockTimeoutMs: number) => {
  await client.query("BEGIN");
  try {
    await client.query(`SET LOCAL lock_timeout = ${lockTimeoutMs}`);
    for (const statement of migration.sql) {
      await client.query(statement);
    }
    await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (hash, created_at) VALUES ($1, $2)`, [
      migration.hash,
      migration.folderMillis,
    ]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
};

// Applies pending migrations one transaction per migration, unlike drizzle's
// migrate(), which applies every pending migration in a single transaction.
// Holding every lock until the last migration commits deadlocks against the
// running app during an upgrade that spans several migrations.
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

          logger.warn(
            { err: error, migration: migration.folderMillis, attempt },
            "migration could not get its locks, retrying",
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
        }
      }
    }
  } finally {
    // Closing the session releases the advisory lock.
    await client.end();
  }
};
