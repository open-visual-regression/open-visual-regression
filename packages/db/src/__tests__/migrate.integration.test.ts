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

const readRealMigrations = () => {
  const journal: { entries: { tag: string; when: number }[] } = JSON.parse(
    readFileSync(join(migrationsFolder, "meta", "_journal.json"), "utf8"),
  );
  return journal.entries.map(({ tag, when }) => ({
    tag,
    when,
    sql: readFileSync(join(migrationsFolder, `${tag}.sql`), "utf8"),
  }));
};

const findIndex = async (connectionString: string, name: string) => {
  const [index] = await query<{ indisvalid: boolean; definition: string }>(
    connectionString,
    `SELECT indisvalid, pg_get_indexdef(indexrelid) AS definition
     FROM pg_index WHERE indexrelid = to_regclass('public."${name}"')`,
  );
  return index;
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

  test("should retry a migration that times out waiting for a lock until the lock is released", async ({
    databaseUrl,
    createMigrationsFolder,
  }) => {
    const setup = { tag: "0000_setup", when: 1000, sql: `CREATE TABLE "items" ("id" integer);` };
    await runMigrations(databaseUrl, createMigrationsFolder([setup]));

    const app = new Client({ connectionString: databaseUrl });
    await app.connect();
    try {
      await app.query("BEGIN");
      await app.query(`SELECT * FROM "items"`);

      const migrating = runMigrations(
        databaseUrl,
        createMigrationsFolder([
          setup,
          { tag: "0001_alter", when: 2000, sql: `ALTER TABLE "items" ADD COLUMN "a" integer;` },
        ]),
        { lockTimeoutMs: 100, maxAttempts: 20, retryDelayMs: 10 },
      );

      await new Promise((resolve) => setTimeout(resolve, 500));
      await app.query("COMMIT");
      await migrating;
    } finally {
      await app.end();
    }

    expect(await findAppliedMigrations(databaseUrl)).toHaveLength(2);
  });

  test("should give up on a migration that never gets its lock and leave it unapplied", async ({
    databaseUrl,
    createMigrationsFolder,
  }) => {
    const setup = { tag: "0000_setup", when: 1000, sql: `CREATE TABLE "items" ("id" integer);` };
    await runMigrations(databaseUrl, createMigrationsFolder([setup]));

    const app = new Client({ connectionString: databaseUrl });
    await app.connect();
    try {
      await app.query("BEGIN");
      await app.query(`SELECT * FROM "items"`);

      await expect(
        runMigrations(
          databaseUrl,
          createMigrationsFolder([
            setup,
            { tag: "0001_alter", when: 2000, sql: `ALTER TABLE "items" ADD COLUMN "a" integer;` },
          ]),
          { lockTimeoutMs: 50, maxAttempts: 3, retryDelayMs: 10 },
        ),
      ).rejects.toMatchObject({ code: "55P03" });
    } finally {
      await app.end();
    }

    expect(await findAppliedMigrations(databaseUrl)).toHaveLength(1);
  });

  test("should run a migration marked no-transaction outside a transaction", async ({
    databaseUrl,
    createMigrationsFolder,
  }) => {
    await runMigrations(
      databaseUrl,
      createMigrationsFolder([
        { tag: "0000_setup", when: 1000, sql: `CREATE TABLE "items" ("id" integer);` },
        {
          tag: "0001_index",
          when: 2000,
          sql: `-- ovr:no-transaction
DROP INDEX CONCURRENTLY IF EXISTS "items_id_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "items_id_idx" ON "items" USING btree ("id");`,
        },
      ]),
    );

    const [index] = await query<{ indisvalid: boolean }>(
      databaseUrl,
      `SELECT indisvalid FROM pg_index WHERE indexrelid = 'items_id_idx'::regclass`,
    );
    expect(index?.indisvalid).toBe(true);
    expect(await findAppliedMigrations(databaseUrl)).toHaveLength(2);
  });

  test("should build an index concurrently while another runner waits its turn", async ({
    databaseUrl,
    createMigrationsFolder,
  }) => {
    const folder = createMigrationsFolder([
      { tag: "0000_setup", when: 1000, sql: `CREATE TABLE "items" ("id" integer);` },
      {
        tag: "0001_index",
        when: 2000,
        sql: `-- ovr:no-transaction
DROP INDEX CONCURRENTLY IF EXISTS "items_id_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "items_id_idx" ON "items" USING btree ("id");`,
      },
    ]);

    await Promise.all([runMigrations(databaseUrl, folder), runMigrations(databaseUrl, folder)]);

    expect(await findAppliedMigrations(databaseUrl)).toHaveLength(2);
  });

  test("should rerun a no-transaction migration from the top after it fails partway", async ({
    databaseUrl,
    createMigrationsFolder,
  }) => {
    const setup = { tag: "0000_setup", when: 1000, sql: `CREATE TABLE "items" ("id" integer);` };
    const createIndex = `-- ovr:no-transaction
DROP INDEX CONCURRENTLY IF EXISTS "items_id_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "items_id_idx" ON "items" USING btree ("id");`;

    await expect(
      runMigrations(
        databaseUrl,
        createMigrationsFolder([
          setup,
          {
            tag: "0001_index",
            when: 2000,
            sql: `${createIndex}--> statement-breakpoint
CREATE TABLE "broken" ("id" not_a_type);`,
          },
        ]),
      ),
    ).rejects.toThrow(/not_a_type/);
    expect(await findAppliedMigrations(databaseUrl)).toHaveLength(1);

    await runMigrations(
      databaseUrl,
      createMigrationsFolder([setup, { tag: "0001_index", when: 2000, sql: createIndex }]),
    );

    expect(await findAppliedMigrations(databaseUrl)).toHaveLength(2);
  });

  test("should keep a foreign key index created by hand and rebuild one left invalid", async ({
    databaseUrl,
    createMigrationsFolder,
  }) => {
    const migrations = readRealMigrations();
    const before = migrations.filter(({ tag }) => tag < "0056");
    await runMigrations(databaseUrl, createMigrationsFolder(before));
    await query(
      databaseUrl,
      `CREATE INDEX "diffs_baselineSnapshotId_idx" ON "diffs" ("baseline_snapshot_id") WITH (fillfactor = 80)`,
    );
    await query(databaseUrl, `CREATE INDEX "builds_createdBy_idx" ON "builds" ("created_by")`);
    await query(
      databaseUrl,
      `UPDATE pg_index SET indisvalid = false WHERE indexrelid = 'public."builds_createdBy_idx"'::regclass`,
    );

    await runMigrations(databaseUrl, createMigrationsFolder(migrations));

    expect(await findIndex(databaseUrl, "diffs_baselineSnapshotId_idx")).toMatchObject({
      indisvalid: true,
      definition: expect.stringContaining("fillfactor"),
    });
    expect(await findIndex(databaseUrl, "builds_createdBy_idx")).toMatchObject({
      indisvalid: true,
    });
    expect(await findIndex(databaseUrl, "invitation_inviterId_idx")).toMatchObject({
      indisvalid: true,
    });
  });
});
