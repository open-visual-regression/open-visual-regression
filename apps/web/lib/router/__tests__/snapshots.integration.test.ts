import { v7 as uuidv7 } from "uuid";
import { vi } from "vitest";

import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";
import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { organization, projects } from "@ovr/db/schema";

import type { User } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

const VIEWPORT = {
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  viewportName: "desktop",
};

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
      const [error] = await serverClient.snapshots.getOne({
        snapshotId: uuidv7(),
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("returns NOT_FOUND for a missing snapshot id", async ({ admin: _ }) => {
      const [error] = await serverClient.snapshots.getOne({
        snapshotId: uuidv7(),
      });
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

      const [error] = await serverClient.snapshots.getOne({
        snapshotId: snapshot!.id,
      });

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
            status: "success",
            imagePath: "projects/p/builds/b/snapshots/s.png",
            hasRenderError: true,
          },
        ],
      });

      await dbClient.snapshotLogs.createMany({
        values: [
          {
            snapshotId: snapshot!.id,
            level: "error",
            message: "target failed to render",
          },
        ],
      });

      const [error, result] = await serverClient.snapshots.getOne({
        snapshotId: snapshot!.id,
      });

      expect(error).toBeNull();
      expect(result?.snapshot).toMatchObject({
        id: snapshot!.id,
        targetName: "A",
        targetTitle: "Story",
        imagePath: "projects/p/builds/b/snapshots/s.png",
        browser: VIEWPORT.browser,
        viewportWidth: VIEWPORT.viewportWidth,
        viewportHeight: VIEWPORT.viewportHeight,
        status: "error",
      });
      expect(result?.snapshot.errorLogs).toMatchObject([
        { level: "error", message: "target failed to render" },
      ]);
    });

    test("returns an 'unchanged' status for a captured snapshot whose diff had no pixel changes", async ({
      admin,
    }) => {
      const { build } = await createProjectAndBuild(admin);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...VIEWPORT,
            targetId: "story-a",
            status: "success",
            imagePath: "projects/p/builds/b/snapshots/s.png",
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
        pixelDiffCount: 0,
      });

      const [error, result] = await serverClient.snapshots.getOne({
        snapshotId: snapshot!.id,
      });

      expect(error).toBeNull();
      expect(result?.snapshot.status).toBe("unchanged");
    });

    test("returns an 'auto_approved' status for a captured snapshot whose diff exceeded the threshold", async ({
      admin,
    }) => {
      const { build } = await createProjectAndBuild(admin);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...VIEWPORT,
            targetId: "story-a",
            status: "success",
            imagePath: "projects/p/builds/b/snapshots/s.png",
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
        pixelDiffCount: 512,
        diffPercent: 5,
      });

      const [error, result] = await serverClient.snapshots.getOne({
        snapshotId: snapshot!.id,
      });

      expect(error).toBeNull();
      expect(result?.snapshot.status).toBe("auto_approved");
    });

    test("returns an 'unchanged' status for a captured snapshot whose diff changed within the threshold", async ({
      admin,
    }) => {
      const { build } = await createProjectAndBuild(admin);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...VIEWPORT,
            targetId: "story-a",
            status: "success",
            imagePath: "projects/p/builds/b/snapshots/s.png",
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
        pixelDiffCount: 512,
        diffPercent: 0.01,
      });

      const [error, result] = await serverClient.snapshots.getOne({
        snapshotId: snapshot!.id,
      });

      expect(error).toBeNull();
      expect(result?.snapshot.status).toBe("unchanged");
    });
  });

  describe("list", () => {
    test("maps diffs to 'needs_review' or 'rejected' based on their review status", async ({
      admin,
    }) => {
      const { build } = await createProjectAndBuild(admin);

      const [needsReviewSnapshot, rejectedSnapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...VIEWPORT,
            targetId: "story-a",
            targetTitle: "Story A",
            targetName: "story-a",
            status: "success",
          },
          {
            buildId: build.id,
            ...VIEWPORT,
            targetId: "story-b",
            targetTitle: "Story B",
            targetName: "story-b",
            status: "success",
          },
        ],
      });
      await dbClient.diffs.create({
        snapshotId: needsReviewSnapshot!.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });
      await dbClient.diffs.create({
        snapshotId: rejectedSnapshot!.id,
        processingStatus: "success",
        reviewStatus: "rejected",
      });

      const [error, result] = await serverClient.snapshots.list({ buildId: build.id });

      expect(error).toBeNull();
      expect(result?.snapshots).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ targetId: "story-a", status: "needs_review" }),
          expect.objectContaining({ targetId: "story-b", status: "rejected" }),
        ]),
      );
    });

    test("filters by status", async ({ admin }) => {
      const { build } = await createProjectAndBuild(admin);

      await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...VIEWPORT, targetId: "a", targetTitle: "A", targetName: "a" },
          { buildId: build.id, ...VIEWPORT, targetId: "b", targetTitle: "B", targetName: "b" },
          { buildId: build.id, ...VIEWPORT, targetId: "c", targetTitle: "C", targetName: "c" },
        ],
      });

      const [error, result] = await serverClient.snapshots.list({
        buildId: build.id,
        statuses: ["queued"],
      });

      expect(error).toBeNull();
      expect(result?.total).toBe(3);
      expect(result?.snapshots).toHaveLength(3);
    });

    test("paginates with limit/offset", async ({ admin }) => {
      const { build } = await createProjectAndBuild(admin);

      await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...VIEWPORT, targetId: "a", targetTitle: "A", targetName: "a" },
          { buildId: build.id, ...VIEWPORT, targetId: "b", targetTitle: "B", targetName: "b" },
          { buildId: build.id, ...VIEWPORT, targetId: "c", targetTitle: "C", targetName: "c" },
        ],
      });

      const [error, result] = await serverClient.snapshots.list({
        buildId: build.id,
        limit: 2,
        offset: 1,
      });

      expect(error).toBeNull();
      expect(result?.total).toBe(3);
      expect(result?.snapshots).toHaveLength(2);
    });

    test("sorts by the given sortBy column and direction", async ({ admin }) => {
      const { build } = await createProjectAndBuild(admin);

      await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...VIEWPORT, targetId: "a", targetTitle: "B", targetName: "a" },
          { buildId: build.id, ...VIEWPORT, targetId: "b", targetTitle: "A", targetName: "b" },
        ],
      });

      const [error, result] = await serverClient.snapshots.list({
        buildId: build.id,
        sortBy: [{ column: "targetName", direction: "desc" }],
      });

      expect(error).toBeNull();
      expect(result?.snapshots.map((snapshot) => snapshot.targetId)).toEqual(["b", "a"]);
    });
  });

  describe("getCounts", () => {
    test("should return NOT_FOUND for a build that does not exist", async ({ admin: _ }) => {
      const [error] = await serverClient.snapshots.getCounts({
        buildId: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
      });

      expect(error?.code).toBe("NOT_FOUND");
    });

    test("returns the count of snapshots in each display status", async ({ admin }) => {
      const { build } = await createProjectAndBuild(admin);

      const [queued, unchanged, autoApproved, approved, needsReview, rejected, renderError] =
        await dbClient.snapshots.createMany({
          values: [
            { buildId: build.id, ...VIEWPORT, targetId: "queued" },
            { buildId: build.id, ...VIEWPORT, targetId: "unchanged", status: "success" },
            { buildId: build.id, ...VIEWPORT, targetId: "auto_approved", status: "success" },
            { buildId: build.id, ...VIEWPORT, targetId: "approved", status: "success" },
            { buildId: build.id, ...VIEWPORT, targetId: "needs_review", status: "success" },
            { buildId: build.id, ...VIEWPORT, targetId: "rejected", status: "success" },
            {
              buildId: build.id,
              ...VIEWPORT,
              targetId: "render-error",
              status: "success",
              hasRenderError: true,
            },
          ],
        });

      await dbClient.diffs.create({
        snapshotId: unchanged!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
        pixelDiffCount: 0,
      });
      await dbClient.diffs.create({
        snapshotId: autoApproved!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
        pixelDiffCount: 256,
        diffPercent: 5,
      });
      await dbClient.diffs.create({
        snapshotId: approved!.id,
        processingStatus: "success",
        reviewStatus: "approved",
      });
      await dbClient.diffs.create({
        snapshotId: needsReview!.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });
      await dbClient.diffs.create({
        snapshotId: rejected!.id,
        processingStatus: "success",
        reviewStatus: "rejected",
      });
      await dbClient.diffs.create({
        snapshotId: renderError!.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      expect(queued).toBeTruthy();

      const [error, counts] = await serverClient.snapshots.getCounts({ buildId: build.id });

      expect(error).toBeNull();
      expect(counts).toEqual({
        unchanged: 1,
        auto_approved: 1,
        approved: 1,
        needs_review: 1,
        rejected: 1,
        error: 1,
        canceled: 0,
        queued: 1,
        processing: 0,
      });
    });
  });

  describe("getAdjacent", () => {
    test("should return NOT_FOUND for a missing snapshot id", async ({ admin: _ }) => {
      const [error] = await serverClient.snapshots.getAdjacent({
        snapshotId: uuidv7(),
      });

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
        values: [{ buildId: otherBuild!.id, ...VIEWPORT, targetId: "story-a" }],
      });

      const [error] = await serverClient.snapshots.getAdjacent({
        snapshotId: snapshot!.id,
      });

      expect(error?.code).toBe("NOT_FOUND");
    });

    const seedReviewQueue = async (buildId: string) => {
      const [first, second, third, noDiff, errored] = await dbClient.snapshots.createMany({
        values: [
          { buildId, ...VIEWPORT, targetId: "a", targetTitle: "A", status: "success" },
          { buildId, ...VIEWPORT, targetId: "b", targetTitle: "B", status: "success" },
          { buildId, ...VIEWPORT, targetId: "c", targetTitle: "C", status: "success" },
          { buildId, ...VIEWPORT, targetId: "d", targetTitle: "D", status: "success" },
          {
            buildId,
            ...VIEWPORT,
            targetId: "e",
            targetTitle: "E",
            status: "error",
            hasRenderError: true,
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: first!.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });
      await dbClient.diffs.create({
        snapshotId: second!.id,
        processingStatus: "success",
        reviewStatus: "rejected",
      });
      await dbClient.diffs.create({
        snapshotId: third!.id,
        processingStatus: "success",
        reviewStatus: "approved",
      });
      await dbClient.diffs.create({
        snapshotId: noDiff!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
      });

      return { first: first!, second: second!, third: third!, noDiff: noDiff!, errored: errored! };
    };

    test("returns the next snapshot awaiting review", async ({ admin }) => {
      const { build } = await createProjectAndBuild(admin);
      const { first, second } = await seedReviewQueue(build.id);

      const [error, result] = await serverClient.snapshots.getAdjacent({
        snapshotId: first.id,
      });

      expect(error).toBeNull();
      expect(result?.nextSnapshotId).toBe(second.id);
    });

    test("returns the previous snapshot awaiting review", async ({ admin }) => {
      const { build } = await createProjectAndBuild(admin);
      const { second, third } = await seedReviewQueue(build.id);

      const [error, result] = await serverClient.snapshots.getAdjacent({
        snapshotId: third.id,
      });

      expect(error).toBeNull();
      expect(result?.prevSnapshotId).toBe(second.id);
    });

    test("returns null prevSnapshotId for the first snapshot in the build", async ({ admin }) => {
      const { build } = await createProjectAndBuild(admin);
      const { first } = await seedReviewQueue(build.id);

      const [error, result] = await serverClient.snapshots.getAdjacent({
        snapshotId: first.id,
      });

      expect(error).toBeNull();
      expect(result?.prevSnapshotId).toBeNull();
    });

    test("returns null nextSnapshotId for the last snapshot in the build", async ({ admin }) => {
      const { build } = await createProjectAndBuild(admin);
      const { third } = await seedReviewQueue(build.id);

      const [error, result] = await serverClient.snapshots.getAdjacent({
        snapshotId: third.id,
      });

      expect(error).toBeNull();
      expect(result?.nextSnapshotId).toBeNull();
    });

    test("returns null for both when the snapshot doesn't require review", async ({ admin }) => {
      const { build } = await createProjectAndBuild(admin);
      const { noDiff } = await seedReviewQueue(build.id);

      const [error, result] = await serverClient.snapshots.getAdjacent({
        snapshotId: noDiff.id,
      });

      expect(error).toBeNull();
      expect(result).toEqual({
        prevSnapshotId: null,
        nextSnapshotId: null,
        position: null,
        total: null,
      });
    });

    test("excludes errored snapshots from the review queue, even with a needs_review diff", async ({
      admin,
    }) => {
      const { build } = await createProjectAndBuild(admin);
      const { third, errored } = await seedReviewQueue(build.id);
      await dbClient.diffs.create({
        snapshotId: errored.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      const [error, result] = await serverClient.snapshots.getAdjacent({
        snapshotId: third.id,
      });

      expect(error).toBeNull();
      expect(result?.nextSnapshotId).toBeNull();
    });
  });
});
