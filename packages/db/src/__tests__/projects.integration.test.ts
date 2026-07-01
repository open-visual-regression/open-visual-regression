import { v7 as uuidv7 } from "uuid";

import { dbClient } from "../client";
import { db } from "../db";
import { organization as organizationTable, projects } from "../schema";
import { describe, expect, test } from "./fixtures";

describe("projects", () => {
  describe("listProjects", () => {
    test("should only return projects belonging to the given organization", async ({
      organization,
      project,
      user,
    }) => {
      const [otherOrg] = await db
        .insert(organizationTable)
        .values({ id: uuidv7(), name: "Other Org", slug: uuidv7(), createdAt: new Date() })
        .returning();

      await db.insert(projects).values({
        name: "Other Org Project",
        gitMainBranch: "main",
        organizationId: otherOrg!.id,
        creatorId: user.id,
      });

      const found = await dbClient.projects.listProjects({
        organizationId: organization.id,
        limit: 10,
        offset: 0,
      });

      expect(found.map((p) => p.id)).toEqual([project.id]);
    });

    test("should return the most recently created project first", async ({
      organization,
      user,
    }) => {
      const [older] = await db
        .insert(projects)
        .values({
          name: "Older Project",
          gitMainBranch: "main",
          organizationId: organization.id,
          creatorId: user.id,
          createdAt: "2024-01-01T00:00:00.000Z",
        })
        .returning();

      const [newer] = await db
        .insert(projects)
        .values({
          name: "Newer Project",
          gitMainBranch: "main",
          organizationId: organization.id,
          creatorId: user.id,
          createdAt: "2024-01-02T00:00:00.000Z",
        })
        .returning();

      const found = await dbClient.projects.listProjects({
        organizationId: organization.id,
        limit: 10,
        offset: 0,
      });

      expect(found.map((p) => p.id)).toEqual([newer!.id, older!.id]);
    });

    test("should respect the limit and offset params", async ({ organization, user }) => {
      const created = await Promise.all(
        [0, 1, 2].map((i) =>
          db
            .insert(projects)
            .values({
              name: `Project ${i}`,
              gitMainBranch: "main",
              organizationId: organization.id,
              creatorId: user.id,
              createdAt: `2024-01-0${i + 1}T00:00:00.000Z`,
            })
            .returning(),
        ),
      );
      const [, middle] = created.map(([p]) => p!);

      const found = await dbClient.projects.listProjects({
        organizationId: organization.id,
        limit: 1,
        offset: 1,
      });

      expect(found.map((p) => p.id)).toEqual([middle!.id]);
    });

    test("should return every project when limit and offset are omitted", async ({
      organization,
      project,
      user,
    }) => {
      const [second] = await db
        .insert(projects)
        .values({
          name: "Second Project",
          gitMainBranch: "main",
          organizationId: organization.id,
          creatorId: user.id,
          createdAt: "2024-01-01T00:00:00.000Z",
        })
        .returning();

      const found = await dbClient.projects.listProjects({ organizationId: organization.id });

      expect(found.map((p) => p.id)).toEqual([project.id, second!.id]);
    });
  });

  describe("countProjects", () => {
    test("should return 0 when the organization has no projects", async ({ organization }) => {
      const total = await dbClient.projects.countProjects({ organizationId: organization.id });
      expect(total).toBe(0);
    });

    test("should return the total number of projects for the organization", async ({
      organization,
      project: _project,
      user,
    }) => {
      await db.insert(projects).values({
        name: "Second Project",
        gitMainBranch: "main",
        organizationId: organization.id,
        creatorId: user.id,
      });

      const total = await dbClient.projects.countProjects({ organizationId: organization.id });
      expect(total).toBe(2);
    });

    test("should not count projects belonging to other organizations", async ({
      organization,
      project: _project,
      user,
    }) => {
      const [otherOrg] = await db
        .insert(organizationTable)
        .values({ id: uuidv7(), name: "Other Org", slug: uuidv7(), createdAt: new Date() })
        .returning();

      await db.insert(projects).values({
        name: "Other Org Project",
        gitMainBranch: "main",
        organizationId: otherOrg!.id,
        creatorId: user.id,
      });

      const total = await dbClient.projects.countProjects({ organizationId: organization.id });
      expect(total).toBe(1);
    });
  });
});
