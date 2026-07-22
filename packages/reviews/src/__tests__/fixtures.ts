import type { Redis } from "ioredis";
import { v7 as uuidv7 } from "uuid";
import { test as vitest } from "vitest";

import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { organization, projects, user as userTable } from "@ovr/db/schema";
import { buildRedisConnection } from "@ovr/queue";

export { describe, expect } from "vitest";

type Viewport = {
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  viewportName: string;
};

type Fixtures = {
  reviewer: typeof userTable.$inferSelect;
  organization: typeof organization.$inferSelect;
  project: typeof projects.$inferSelect;
  captureConfiguration: Viewport;
  mainBuild: NonNullable<Awaited<ReturnType<typeof dbClient.builds.create>>>;
  featureBuild: NonNullable<Awaited<ReturnType<typeof dbClient.builds.create>>>;
  connection: Redis;
};

export const test = vitest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  reviewer: async ({}, use) => {
    const [created] = await db
      .insert(userTable)
      .values({
        id: uuidv7(),
        name: "Test Reviewer",
        email: `${uuidv7()}@example.com`,
        role: "reviewer",
      })
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

  project: async ({ reviewer, organization }, use) => {
    const [created] = await db
      .insert(projects)
      .values({
        name: "Test Project",
        gitMainBranch: "main",
        organizationId: organization.id,
        creatorId: reviewer.id,
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

  mainBuild: async ({ project, reviewer }, use) => {
    const created = await dbClient.builds.create({
      projectId: project.id,
      branch: "main",
      commitSha: "a".repeat(40),
      artifactPath: "builds/seed/artifact",
      createdBy: reviewer.id,
    });
    await use(created!);
  },

  featureBuild: async ({ project, reviewer }, use) => {
    const created = await dbClient.builds.create({
      projectId: project.id,
      branch: "feature/test",
      commitSha: "a".repeat(40),
      artifactPath: "builds/seed/artifact",
      createdBy: reviewer.id,
    });
    await use(created!);
  },

  // eslint-disable-next-line no-empty-pattern
  connection: async ({}, use) => {
    const connection = buildRedisConnection(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });

    await use(connection);

    await connection.quit();
  },
});
