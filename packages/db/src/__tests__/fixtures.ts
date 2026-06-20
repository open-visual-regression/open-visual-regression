import { test as vitest } from "vitest";
import { v7 as uuidv7 } from "uuid";

import { dbClient } from "../client";
import { db } from "../db";
import { organization, projects, user as userTable } from "../schema";

export { describe, expect } from "vitest";

type Viewport = { browser: string; viewportWidth: number; viewportHeight: number };

type Fixtures = {
  user: typeof userTable.$inferSelect;
  organization: typeof organization.$inferSelect;
  project: typeof projects.$inferSelect;
  captureConfiguration: Viewport;
  build: NonNullable<Awaited<ReturnType<typeof dbClient.builds.create>>>;
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
        diffThreshold: 0.1,
        gitMainBranch: "main",
        organizationId: organization.id,
        creatorId: user.id,
      })
      .returning();
    await use(created!);
  },

  // eslint-disable-next-line no-empty-pattern
  captureConfiguration: async ({}, use) => {
    await use({ browser: "chromium", viewportWidth: 1280, viewportHeight: 800 });
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
});
