import { vi } from "vitest";
import { v7 as uuidv7 } from "uuid";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { serverClient } from "@/lib/router";
import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { captureConfigurations } from "@ovr/db/schema";
import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";
import type { User } from "@/lib/auth/auth";

vi.mock("next/headers");

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
  diffThreshold: 0.05,
};

const createProjectAndBuild = async (admin: User, requiredReviewerCount = 1) => {
  const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
  const projectId = addResult!.projectId;
  await serverClient.projects.update({ id: projectId, patch: { requiredReviewerCount } });

  const [captureConfiguration] = await db
    .insert(captureConfigurations)
    .values({ projectId, name: "Default" })
    .returning();

  const build = await dbClient.builds.create({
    projectId,
    branch: "feature/test",
    commitSha: "a".repeat(40),
    artifactPath: "builds/seed/artifact",
    createdBy: admin.id,
  });

  return { projectId, captureConfiguration: captureConfiguration!, build: build! };
};

const createAwaitingDiff = async (
  buildId: string,
  captureConfigurationId: string,
  targetId: string,
) => {
  const [snapshot] = await dbClient.snapshots.createMany({
    values: [{ buildId, captureConfigurationId, targetId }],
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
      const diff = await createAwaitingDiff(build.id, captureConfiguration.id, "story-a");

      const [error] = await serverClient.diffs.castVote({ diffId: diff!.id, vote: "approve" });

      expect(error).toBeNull();
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "approved" });
      expect((await dbClient.builds.findById(build.id))?.status).toBe("passed");
    });

    test("a reject vetoes regardless of existing approvals", async ({ admin }) => {
      const { build, captureConfiguration } = await createProjectAndBuild(admin, 2);
      const diff = await createAwaitingDiff(build.id, captureConfiguration.id, "story-a");

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
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
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
      const diff = await createAwaitingDiff(build.id, captureConfiguration.id, "story-a");

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
      const awaitingDiff = await createAwaitingDiff(build.id, captureConfiguration.id, "story-a");
      const [notRequiredSnapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
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
