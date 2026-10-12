import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool, type QueryResultRow } from "pg";
import { vi } from "vitest";

import { runMigrations } from "../migrate";
import { describe, expect, test } from "./fixtures";

const migrationsFolder = resolve(import.meta.dirname, "../migrations");

const query = async <T extends QueryResultRow>(connectionString: string, sql: string) => {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return (await client.query<T>(sql)).rows;
  } finally {
    await client.end();
  }
};

const findAppliedMigrations = (connectionString: string) =>
  query<{ hash: string; created_at: string }>(
    connectionString,
    `SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`,
  );

const tableExists = async (connectionString: string, table: string) => {
  const [row] = await query<{ exists: boolean }>(
    connectionString,
    `SELECT to_regclass('public.${table}') IS NOT NULL AS exists`,
  );
  return row!.exists;
};

const runDrizzleMigrations = async (connectionString: string, folder: string) => {
  const pool = new Pool({ connectionString });
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: folder });
  } finally {
    await pool.end();
  }
};

describe("runMigrations", () => {
  test("should apply every migration once and do nothing on a second run", async ({
    databaseUrl,
  }) => {
    const journal = JSON.parse(
      readFileSync(join(migrationsFolder, "meta", "_journal.json"), "utf8"),
    );

    await runMigrations(databaseUrl, migrationsFolder);
    const applied = await findAppliedMigrations(databaseUrl);
    await runMigrations(databaseUrl, migrationsFolder);

    expect(applied).toHaveLength(journal.entries.length);
    expect(await findAppliedMigrations(databaseUrl)).toEqual(applied);
  });

  test("should keep the migrations that committed before a failing one and resume after a fix", async ({
    databaseUrl,
    createMigrationsFolder,
  }) => {
    const first = { tag: "0000_first", when: 1000, sql: `CREATE TABLE "first" ("id" integer);` };
    const third = { tag: "0002_third", when: 3000, sql: `CREATE TABLE "third" ("id" integer);` };
    const broken = createMigrationsFolder([
      first,
      { tag: "0001_second", when: 2000, sql: `CREATE TABLE "second" ("id" not_a_type);` },
      third,
    ]);
    const fixed = createMigrationsFolder([
      first,
      { tag: "0001_second", when: 2000, sql: `CREATE TABLE "second" ("id" integer);` },
      third,
    ]);

    await expect(runMigrations(databaseUrl, broken)).rejects.toThrow(/not_a_type/);

    expect(await tableExists(databaseUrl, "first")).toBe(true);
    expect(await tableExists(databaseUrl, "second")).toBe(false);
    expect(await findAppliedMigrations(databaseUrl)).toHaveLength(1);

    await runMigrations(databaseUrl, fixed);

    expect(await tableExists(databaseUrl, "second")).toBe(true);
    expect(await tableExists(databaseUrl, "third")).toBe(true);
    expect(await findAppliedMigrations(databaseUrl)).toHaveLength(3);
  });

  test("should apply each migration exactly once when two runners start together", async ({
    databaseUrl,
  }) => {
    await Promise.all([
      runMigrations(databaseUrl, migrationsFolder),
      runMigrations(databaseUrl, migrationsFolder),
    ]);

    const applied = await findAppliedMigrations(databaseUrl);
    expect(new Set(applied.map((row) => row.created_at)).size).toBe(applied.length);
  });

  test("should share bookkeeping with drizzle's migrator in both directions", async ({
    databaseUrl,
    createMigrationsFolder,
  }) => {
    const migrations = [
      { tag: "0000_a", when: 1000, sql: `CREATE TABLE "a" ("id" integer);` },
      { tag: "0001_b", when: 2000, sql: `CREATE TABLE "b" ("id" integer);` },
      { tag: "0002_c", when: 3000, sql: `CREATE TABLE "c" ("id" integer);` },
    ];

    await runDrizzleMigrations(databaseUrl, createMigrationsFolder(migrations.slice(0, 2)));
    await runMigrations(databaseUrl, createMigrationsFolder(migrations));
    const applied = await findAppliedMigrations(databaseUrl);
    await runDrizzleMigrations(databaseUrl, createMigrationsFolder(migrations));

    expect(applied).toHaveLength(3);
    expect(await findAppliedMigrations(databaseUrl)).toEqual(applied);
  });

  // A running app transaction reads `parents`, the upgrade alters `children` and
  // then `parents`, and the app then reads `children`. If every migration ran in
  // one transaction, the upgrade would still hold its lock on `children` while
  // waiting on `parents`, and the two would deadlock.
  test("should not deadlock with app transactions that lock tables in a different order", async ({
    databaseUrl,
    createMigrationsFolder,
  }) => {
    const setup = {
      tag: "0000_setup",
      when: 1000,
      sql: `CREATE TABLE "parents" ("id" integer PRIMARY KEY);--> statement-breakpoint
CREATE TABLE "children" ("id" integer PRIMARY KEY, "parent_id" integer REFERENCES "parents"("id"));`,
    };
    const upgrade = createMigrationsFolder([
      setup,
      { tag: "0001_children", when: 2000, sql: `ALTER TABLE "children" ADD COLUMN "a" integer;` },
      { tag: "0002_parents", when: 3000, sql: `ALTER TABLE "parents" ADD COLUMN "b" integer;` },
    ]);
    await runMigrations(databaseUrl, createMigrationsFolder([setup]));

    const app = new Client({ connectionString: databaseUrl });
    await app.connect();
    try {
      await app.query("BEGIN");
      await app.query(`SELECT * FROM "parents"`);

      const migrating = runMigrations(databaseUrl, upgrade);

      await vi.waitFor(
        async () => {
          const waiting = await query(
            databaseUrl,
            `SELECT 1 FROM pg_stat_activity
             WHERE wait_event_type = 'Lock' AND query LIKE 'ALTER TABLE "parents"%'`,
          );
          expect(waiting).toHaveLength(1);
        },
        { timeout: 10_000, interval: 50 },
      );

      await app.query(`SELECT * FROM "children"`);
      await app.query("COMMIT");
      await migrating;
    } finally {
      await app.end();
    }

    expect(await findAppliedMigrations(databaseUrl)).toHaveLength(3);
  });
});
