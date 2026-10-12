import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Client } from "pg";
import { v7 as uuidv7 } from "uuid";
import { test as vitest } from "vitest";

import { dbClient } from "../client";
import { db } from "../db";
import { organization, projects, user as userTable } from "../schema";

export { describe, expect } from "vitest";

export type Viewport = {
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  viewportName: string;
};

export type TestMigration = {
  tag: string;
  when: number;
  sql: string;
};

type Fixtures = {
  user: typeof userTable.$inferSelect;
  organization: typeof organization.$inferSelect;
  project: typeof projects.$inferSelect;
  captureConfiguration: Viewport;
  build: NonNullable<Awaited<ReturnType<typeof dbClient.builds.create>>>;
  databaseUrl: string;
  createMigrationsFolder: (migrations: TestMigration[]) => string;
};

const withAdminClient = async (run: (client: Client) => Promise<unknown>) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await run(client);
  } finally {
    await client.end();
  }
};

export const test = vitest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  user: async ({}, use) => {
    const [created] = await db
      .insert(userTable)
      .values({ id: uuidv7(), name: "Test User", email: `${uuidv7()}@example.com` })
      .returning();
    await use(created!);
  },

  // eslint-disable-next-line no-empty-pattern
  organization: async ({}, use) => {
    const [created] = await db
      .insert(organization)
      .values({ id: uuidv7(), name: "Test Org", slug: uuidv7(), createdAt: new Date() })
      .returning();
    await use(created!);
  },

  project: async ({ user, organization }, use) => {
    const [created] = await db
      .insert(projects)
      .values({
        name: "Test Project",
        gitMainBranch: "main",
        organizationId: organization.id,
        creatorId: user.id,
      })
      .returning();
    await use(created!);
  },

  // eslint-disable-next-line no-empty-pattern
  captureConfiguration: async ({}, use) => {
    await use({
      browser: "chromium",
      viewportWidth: 1280,
      viewportHeight: 800,
      viewportName: "desktop",
    });
  },

  build: async ({ project, user }, use) => {
    const created = await dbClient.builds.create({
      projectId: project.id,
      branch: "main",
      commitSha: "a".repeat(40),
      artifactPath: "builds/seed/artifact",
      createdBy: user.id,
    });
    await use(created!);
  },

  // An empty database of its own, for tests that run migrations from scratch.
  // eslint-disable-next-line no-empty-pattern
  databaseUrl: async ({}, use) => {
    const name = `test_${uuidv7().replaceAll("-", "")}`;
    await withAdminClient((client) => client.query(`CREATE DATABASE "${name}"`));

    const url = new URL(process.env.DATABASE_URL!);
    url.pathname = `/${name}`;
    await use(url.toString());

    await withAdminClient((client) => client.query(`DROP DATABASE "${name}" WITH (FORCE)`));
  },

  // Writes migrations in the layout drizzle-kit generates: one SQL file per
  // migration plus meta/_journal.json.
  // eslint-disable-next-line no-empty-pattern
  createMigrationsFolder: async ({}, use) => {
    const folders: string[] = [];

    await use((migrations) => {
      const folder = mkdtempSync(join(tmpdir(), "ovr-migrations-"));
      folders.push(folder);
      mkdirSync(join(folder, "meta"));
      writeFileSync(
        join(folder, "meta", "_journal.json"),
        JSON.stringify({
          version: "7",
          dialect: "postgresql",
          entries: migrations.map(({ tag, when }, idx) => ({
            idx,
            version: "7",
            when,
            tag,
            breakpoints: true,
          })),
        }),
      );
      for (const { tag, sql } of migrations) {
        writeFileSync(join(folder, `${tag}.sql`), sql);
      }
      return folder;
    });

    for (const folder of folders) {
      rmSync(folder, { recursive: true, force: true });
    }
  },
});
