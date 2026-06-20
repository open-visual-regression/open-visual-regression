import { vi } from "vitest";
import { v7 as uuidv7 } from "uuid";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { serverClient } from "@/lib/router";
import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { organization, projects } from "@ovr/db/schema";
import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";
import type { User } from "@/lib/auth/auth";

vi.mock("next/headers");

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
  diffThreshold: 0.05,
};

const VIEWPORT = { browser: "chromium", viewportWidth: 1280, viewportHeight: 800 };

const createProjectAndBuild = async (admin: User) => {
  const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
  const projectId = addResult!.projectId;

  const build = await dbClient.builds.create({
    projectId,
    branch: "feature/test",
    commitSha: "a".repeat(40),
    artifactPath: "builds/seed/artifact",
    createdBy: admin.id,
  });

  return { projectId, build: build! };
};

describe("snapshots", () => {
  describe("getOne", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.snapshots.getOne({ snapshotId: uuidv7() });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("returns NOT_FOUND for a missing snapshot id", async ({ admin: _ }) => {
      const [error] = await serverClient.snapshots.getOne({ snapshotId: uuidv7() });
      expect(error?.code).toBe("NOT_FOUND");
    });

    test("returns NOT_FOUND for a snapshot belonging to a different organization", async ({
      admin,
    }) => {
      const [otherOrg] = await db
        .insert(organization)
        .values({
          id: crypto.randomUUID(),
          name: "Other Org",
          slug: crypto.randomUUID(),
          createdAt: new Date(),
        })
        .returning();

      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Org Project",
          diffThreshold: 0.1,
          gitMainBranch: "main",
          organizationId: otherOrg!.id,
          creatorId: admin.id,
        })
        .returning();

      const otherBuild = await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/other/artifact",
        createdBy: admin.id,
      });

      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: otherBuild!.id,
            ...VIEWPORT,
            targetId: "story-a",
          },
        ],
      });

      const [error] = await serverClient.snapshots.getOne({ snapshotId: snapshot!.id });

      expect(error?.code).toBe("NOT_FOUND");
    });

    test("returns the snapshot with its browser and viewport, and error logs", async ({
      admin,
    }) => {
      const { build } = await createProjectAndBuild(admin);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...VIEWPORT,
            targetId: "story-a",
            targetTitle: "Story",
            targetName: "A",
            status: "captured",
            imagePath: "projects/p/builds/b/snapshots/s.png",
            hasRenderError: true,
          },
        ],
      });

      await dbClient.snapshotLogs.createMany({
        values: [{ snapshotId: snapshot!.id, level: "error", message: "target failed to render" }],
      });

      const [error, result] = await serverClient.snapshots.getOne({ snapshotId: snapshot!.id });

      expect(error).toBeNull();
      expect(result?.snapshot).toMatchObject({
        id: snapshot!.id,
        targetName: "A",
        targetTitle: "Story",
        imagePath: "projects/p/builds/b/snapshots/s.png",
        browser: VIEWPORT.browser,
        viewportWidth: VIEWPORT.viewportWidth,
        viewportHeight: VIEWPORT.viewportHeight,
      });
      expect(result?.snapshot.errorLogs).toMatchObject([
        { level: "error", message: "target failed to render" },
      ]);
    });
  });
});
