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

const createProjectAndBuild = async (admin: User, requiredReviewerCount = 1) => {
  const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
  const projectId = addResult!.projectId;
  await serverClient.projects.update({ id: projectId, patch: { requiredReviewerCount } });

  const build = await dbClient.builds.create({
    projectId,
    branch: "feature/test",
    commitSha: "a".repeat(40),
    artifactPath: "builds/seed/artifact",
    createdBy: admin.id,
  });

  return { projectId, captureConfiguration: VIEWPORT, build: build! };
};

const createAwaitingDiff = async (buildId: string, viewport: typeof VIEWPORT, targetId: string) => {
  const [snapshot] = await dbClient.snapshots.createMany({
    values: [{ buildId, ...viewport, targetId }],
  });
  return dbClient.diffs.create({ snapshotId: snapshot!.id, reviewStatus: "needs_review" });
};

describe("diffs", () => {
  describe("castVote", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.diffs.castVote({
        diffId: uuidv7(),
        vote: "approve",
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("approves the diff and finalizes the build when the last diff is approved", async ({
      admin,
    }) => {
      const { build, captureConfiguration } = await createProjectAndBuild(admin, 1);
      const diff = await createAwaitingDiff(build.id, captureConfiguration, "story-a");

      const [error] = await serverClient.diffs.castVote({ diffId: diff!.id, vote: "approve" });

      expect(error).toBeNull();
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "approved" });
      expect((await dbClient.builds.findById(build.id))?.reviewStatus).toBe("approved");
    });

    test("a reject vetoes regardless of existing approvals", async ({ admin }) => {
      const { build, captureConfiguration } = await createProjectAndBuild(admin, 2);
      const diff = await createAwaitingDiff(build.id, captureConfiguration, "story-a");

      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: admin.id,
        vote: "approve",
      });

      const [error] = await serverClient.diffs.castVote({ diffId: diff!.id, vote: "reject" });

      expect(error).toBeNull();
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "rejected" });
    });

    test("returns BAD_REQUEST for a diff that does not need review", async ({ admin }) => {
      const { build, captureConfiguration } = await createProjectAndBuild(admin);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      const [error] = await serverClient.diffs.castVote({ diffId: diff!.id, vote: "approve" });

      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("returns NOT_FOUND for a missing diff id", async ({ admin: _ }) => {
      const [error] = await serverClient.diffs.castVote({
        diffId: uuidv7(),
        vote: "approve",
      });

      expect(error?.code).toBe("NOT_FOUND");
    });
  });

  describe("removeVote", () => {
    test("clears the caller's vote and recomputes the review status", async ({ admin }) => {
      const { build, captureConfiguration } = await createProjectAndBuild(admin, 1);
      const diff = await createAwaitingDiff(build.id, captureConfiguration, "story-a");

      await serverClient.diffs.castVote({ diffId: diff!.id, vote: "reject" });
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "rejected" });

      const [error] = await serverClient.diffs.removeVote({ diffId: diff!.id });

      expect(error).toBeNull();
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        reviewStatus: "needs_review",
      });
    });
  });

  describe("bulkCastVote", () => {
    test("casts the caller's vote across every needs_review diff, skipping terminal ones", async ({
      admin,
    }) => {
      const { build, captureConfiguration } = await createProjectAndBuild(admin, 1);
      const awaitingDiff = await createAwaitingDiff(build.id, captureConfiguration, "story-a");
      const [notRequiredSnapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "story-b",
          },
        ],
      });
      const notRequiredDiff = await dbClient.diffs.create({
        snapshotId: notRequiredSnapshot!.id,
        reviewStatus: "not_required",
      });

      const [error] = await serverClient.diffs.bulkCastVote({ buildId: build.id, vote: "approve" });

      expect(error).toBeNull();
      expect(await dbClient.diffs.findById(awaitingDiff!.id)).toMatchObject({
        reviewStatus: "approved",
      });
      expect(await dbClient.diffs.findById(notRequiredDiff!.id)).toMatchObject({
        reviewStatus: "not_required",
      });
    });
  });

  describe("getOne", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.diffs.getOne({ snapshotId: uuidv7() });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("returns NOT_FOUND for a missing snapshot id", async ({ admin: _ }) => {
      const [error] = await serverClient.diffs.getOne({ snapshotId: uuidv7() });
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

      const diff = await createAwaitingDiff(otherBuild!.id, VIEWPORT, "story-a");

      const [error] = await serverClient.diffs.getOne({ snapshotId: diff!.snapshotId });

      expect(error?.code).toBe("NOT_FOUND");
    });

    test("returns the diff for a snapshot", async ({ admin }) => {
      const { build, captureConfiguration } = await createProjectAndBuild(admin);
      const diff = await createAwaitingDiff(build.id, captureConfiguration, "story-a");

      const [error, result] = await serverClient.diffs.getOne({ snapshotId: diff!.snapshotId });

      expect(error).toBeNull();
      expect(result?.diff).toMatchObject({ id: diff!.id, reviewStatus: "needs_review" });
    });

    test("returns null when the snapshot has no diff yet", async ({ admin }) => {
      const { build, captureConfiguration } = await createProjectAndBuild(admin);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });

      const [error, result] = await serverClient.diffs.getOne({ snapshotId: snapshot!.id });

      expect(error).toBeNull();
      expect(result?.diff).toBeNull();
    });
  });

  describe("listReviews", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.diffs.listReviews({ snapshotId: uuidv7() });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("returns NOT_FOUND for a missing snapshot id", async ({ admin: _ }) => {
      const [error] = await serverClient.diffs.listReviews({ snapshotId: uuidv7() });
      expect(error?.code).toBe("NOT_FOUND");
    });

    test("returns the reviewers and required reviewer count for a reviewed snapshot", async ({
      admin,
    }) => {
      const { build, captureConfiguration } = await createProjectAndBuild(admin, 2);
      const diff = await createAwaitingDiff(build.id, captureConfiguration, "story-a");
      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: admin.id,
        vote: "approve",
      });

      const [error, result] = await serverClient.diffs.listReviews({
        snapshotId: diff!.snapshotId,
      });

      expect(error).toBeNull();
      expect(result?.requiredReviewerCount).toBe(2);
      expect(result?.reviews).toEqual([
        expect.objectContaining({ reviewerId: admin.id, name: admin.name, vote: "approve" }),
      ]);
    });

    test("returns an empty review list when nobody has voted", async ({ admin }) => {
      const { build, captureConfiguration } = await createProjectAndBuild(admin);
      const diff = await createAwaitingDiff(build.id, captureConfiguration, "story-a");

      const [error, result] = await serverClient.diffs.listReviews({
        snapshotId: diff!.snapshotId,
      });

      expect(error).toBeNull();
      expect(result?.reviews).toEqual([]);
    });
  });

  describe("projects.update", () => {
    test("can set and read back requiredReviewerCount", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [updateError] = await serverClient.projects.update({
        id: projectId,
        patch: { requiredReviewerCount: 3 },
      });
      expect(updateError).toBeNull();

      const [, getResult] = await serverClient.projects.getOne({ projectId });
      expect(getResult?.project.requiredReviewerCount).toBe(3);
    });
  });
});
