import path from "node:path";

import { readMigrationFiles } from "drizzle-orm/migrator";
import { Client } from "pg";

// Same bookkeeping table as drizzle's migrator, so databases migrated by either
// one are interchangeable.
const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = `"${MIGRATIONS_SCHEMA}"."__drizzle_migrations"`;

// Arbitrary key for the advisory lock that keeps two migrators from running at
// once (for example a retried Job overlapping the previous attempt).
const MIGRATION_LOCK_KEY = 7_315_420_118;

// Applies pending migrations one transaction per migration, unlike drizzle's
// migrate(), which applies every pending migration in a single transaction.
// Holding every lock until the last migration commits deadlocks against the
// running app during an upgrade that spans several migrations.
export const runMigrations = async (
  connectionString: string,
  migrationsFolder: string = path.resolve(import.meta.dirname, "migrations"),
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

      await client.query("BEGIN");
      try {
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
    }
  } finally {
    // Closing the session releases the advisory lock.
    await client.end();
  }
};
