import assert from "node:assert";

import { v7 as uuidv7 } from "uuid";

import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { user as userTable } from "@ovr/db/schema";

import { bulkCastVote, castVote, removeVote } from "../diffs";
import { describe, expect, test } from "./fixtures";

const createUser = async () => {
  const [created] = await db
    .insert(userTable)
    .values({ id: uuidv7(), name: "Other Reviewer", email: `${uuidv7()}@example.com` })
    .returning();
  return created!;
};

describe("diffs", () => {
  describe("castVote", () => {
    test("approves a diff once requiredReviewerCount distinct approvals are cast", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "awaiting_review",
      });

      const result = await castVote(diff!.id, user.id, "approve");

      assert(result.status === "ok");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "approved" });
    });

    test("stays awaiting_review until enough distinct reviewers approve", async ({
      project,
      build,
      captureConfiguration,
      user,
    }) => {
      await dbClient.projects.updateProject(project.id, { requiredReviewerCount: 2 });

      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "awaiting_review",
      });

      await castVote(diff!.id, user.id, "approve");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        reviewStatus: "awaiting_review",
      });

      const otherReviewer = await createUser();
      const result = await castVote(diff!.id, otherReviewer.id, "approve");
      assert(result.status === "ok");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "approved" });
    });

    test("a single reject vetoes regardless of existing approvals", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "awaiting_review",
      });

      const otherReviewer = await createUser();
      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: otherReviewer.id,
        vote: "approve",
      });

      const result = await castVote(diff!.id, user.id, "reject");

      assert(result.status === "ok");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "rejected" });
    });

    test("the same reviewer voting again replaces their previous vote", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "awaiting_review",
      });

      await castVote(diff!.id, user.id, "approve");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "approved" });

      await castVote(diff!.id, user.id, "reject");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "rejected" });
    });

    test("returns REVIEW_NOT_REQUIRED for a diff that doesn't need review", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      const result = await castVote(diff!.id, user.id, "approve");

      expect(result).toEqual({ status: "error", error: "REVIEW_NOT_REQUIRED" });
    });

    test("returns DIFF_NOT_FOUND for a missing diff id", async ({ user }) => {
      const result = await castVote(crypto.randomUUID(), user.id, "approve");

      expect(result).toEqual({ status: "error", error: "DIFF_NOT_FOUND" });
    });

    test("finalizes the build once the last awaiting_review diff is approved", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        processingStatus: "diffed",
        reviewStatus: "awaiting_review",
      });

      await castVote(diff!.id, user.id, "approve");

      expect((await dbClient.builds.findById(build.id))?.status).toBe("passed");
    });
  });

  describe("removeVote", () => {
    test("reverts to awaiting_review once the only reject is removed", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "awaiting_review",
      });

      await castVote(diff!.id, user.id, "reject");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "rejected" });

      const result = await removeVote(diff!.id, user.id);

      assert(result.status === "ok");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        reviewStatus: "awaiting_review",
      });
    });

    test("reverts to approved when enough other approvals already exist", async ({
      project,
      build,
      captureConfiguration,
      user,
    }) => {
      await dbClient.projects.updateProject(project.id, { requiredReviewerCount: 1 });

      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "awaiting_review",
      });

      const otherReviewer = await createUser();
      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: otherReviewer.id,
        vote: "approve",
      });
      await castVote(diff!.id, user.id, "reject");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "rejected" });

      await removeVote(diff!.id, user.id);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "approved" });
    });
  });

  describe("bulkCastVote", () => {
    test("casts the vote across every awaiting_review diff, leaving terminal diffs untouched", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshotA, snapshotB, snapshotC] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "b" },
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "c" },
        ],
      });
      const awaitingDiff = await dbClient.diffs.create({
        snapshotId: snapshotA!.id,
        reviewStatus: "awaiting_review",
      });
      const approvedDiff = await dbClient.diffs.create({
        snapshotId: snapshotB!.id,
        reviewStatus: "approved",
      });
      const notRequiredDiff = await dbClient.diffs.create({
        snapshotId: snapshotC!.id,
        reviewStatus: "not_required",
      });

      await bulkCastVote(build.id, user.id, "approve");

      expect(await dbClient.diffs.findById(awaitingDiff!.id)).toMatchObject({
        reviewStatus: "approved",
      });
      expect(await dbClient.diffs.findById(approvedDiff!.id)).toMatchObject({
        reviewStatus: "approved",
      });
      expect(await dbClient.diffs.findById(notRequiredDiff!.id)).toMatchObject({
        reviewStatus: "not_required",
      });
    });
  });
});
