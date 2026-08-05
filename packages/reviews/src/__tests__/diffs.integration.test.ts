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
    .values({
      id: uuidv7(),
      name: "Other Reviewer",
      email: `${uuidv7()}@example.com`,
      role: "reviewer",
    })
    .returning();
  return created!;
};

describe("diffs", () => {
  describe("castVote", () => {
    test("approves a diff once requiredReviewerCount distinct approvals are cast", async ({
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "needs_review",
      });

      const result = await castVote(diff!.id, reviewer.id, "approve");

      assert(result.status === "ok");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "approved" });
    });

    test("stays needs_review until enough distinct reviewers approve", async ({
      project,
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      await dbClient.projects.updateProject(project.id, { requiredReviewerCount: 2 });

      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "needs_review",
      });

      await castVote(diff!.id, reviewer.id, "approve");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        reviewStatus: "needs_review",
      });

      const otherReviewer = await createUser();
      const result = await castVote(diff!.id, otherReviewer.id, "approve");
      assert(result.status === "ok");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "approved" });
    });

    test("a single reject vetoes regardless of existing approvals", async ({
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "needs_review",
      });

      const otherReviewer = await createUser();
      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: otherReviewer.id,
        vote: "approve",
      });

      const result = await castVote(diff!.id, reviewer.id, "reject");

      assert(result.status === "ok");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "rejected" });
    });

    test("the same reviewer voting again replaces their previous vote", async ({
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "needs_review",
      });

      await castVote(diff!.id, reviewer.id, "approve");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "approved" });

      await castVote(diff!.id, reviewer.id, "reject");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "rejected" });
    });

    test("returns REVIEW_NOT_REQUIRED for a diff that doesn't need review", async ({
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      const result = await castVote(diff!.id, reviewer.id, "approve");

      expect(result).toEqual({ status: "error", error: "REVIEW_NOT_REQUIRED" });
    });

    test("returns DIFF_NOT_FOUND for a missing diff id", async ({ reviewer }) => {
      const result = await castVote(crypto.randomUUID(), reviewer.id, "approve");

      expect(result).toEqual({ status: "error", error: "DIFF_NOT_FOUND" });
    });

    test("finalizes the build once the last needs_review diff is approved", async ({
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      await castVote(diff!.id, reviewer.id, "approve");

      expect((await dbClient.builds.findById(mainBuild.id))?.reviewStatus).toBe("approved");
    });
  });

  describe("removeVote", () => {
    test("reverts to needs_review once the only reject is removed", async ({
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "needs_review",
      });

      await castVote(diff!.id, reviewer.id, "reject");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "rejected" });

      const result = await removeVote({
        diffId: diff!.id,
        requesterId: reviewer.id,
      });

      assert(result.status === "ok");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        reviewStatus: "needs_review",
      });
    });

    test("reverts to approved when enough other approvals already exist", async ({
      project,
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      await dbClient.projects.updateProject(project.id, { requiredReviewerCount: 1 });

      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "needs_review",
      });

      const otherReviewer = await createUser();
      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: otherReviewer.id,
        vote: "approve",
      });
      await castVote(diff!.id, reviewer.id, "reject");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "rejected" });

      await removeVote({ diffId: diff!.id, requesterId: reviewer.id });

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "approved" });
    });

    test("reverts to needs_review when an admin removes another reviewer's vote", async ({
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "needs_review",
      });

      await castVote(diff!.id, reviewer.id, "reject");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ reviewStatus: "rejected" });

      const admin = await createUser();
      const result = await removeVote({
        diffId: diff!.id,
        requesterId: admin.id,
        requesterRole: "admin",
        targetReviewerId: reviewer.id,
      });

      assert(result.status === "ok");
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        reviewStatus: "needs_review",
      });
    });

    test("returns FORBIDDEN when a non-admin tries to remove another reviewer's vote", async ({
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "needs_review",
      });

      const otherReviewer = await createUser();
      await castVote(diff!.id, otherReviewer.id, "approve");

      const result = await removeVote({
        diffId: diff!.id,
        requesterId: reviewer.id,
        targetReviewerId: otherReviewer.id,
      });

      assert(result.status === "error");
      expect(result.error).toBe("FORBIDDEN");
      expect(await dbClient.diffReviews.findByDiff(diff!.id)).toHaveLength(1);
    });
  });

  describe("bulkCastVote", () => {
    test("casts the vote across every reviewable diff, leaving not_required diffs untouched", async ({
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      const [snapshotA, snapshotB, snapshotC] = await dbClient.snapshots.createMany({
        values: [
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "a" },
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "b" },
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "c" },
        ],
      });
      const awaitingDiff = await dbClient.diffs.create({
        snapshotId: snapshotA!.id,
        reviewStatus: "needs_review",
      });
      const approvedDiff = await dbClient.diffs.create({
        snapshotId: snapshotB!.id,
        reviewStatus: "approved",
      });
      const notRequiredDiff = await dbClient.diffs.create({
        snapshotId: snapshotC!.id,
        reviewStatus: "not_required",
      });

      await bulkCastVote(mainBuild.id, reviewer.id, "approve");

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

    test("overrides already-decided diffs with the new vote", async ({
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      const [snapshotA, snapshotB] = await dbClient.snapshots.createMany({
        values: [
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "a" },
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "b" },
        ],
      });
      const approvedDiff = await dbClient.diffs.create({
        snapshotId: snapshotA!.id,
        reviewStatus: "approved",
      });
      const rejectedDiff = await dbClient.diffs.create({
        snapshotId: snapshotB!.id,
        reviewStatus: "rejected",
      });

      await bulkCastVote(mainBuild.id, reviewer.id, "reject");

      expect(await dbClient.diffs.findById(approvedDiff!.id)).toMatchObject({
        reviewStatus: "rejected",
      });
      expect(await dbClient.diffs.findById(rejectedDiff!.id)).toMatchObject({
        reviewStatus: "rejected",
      });
    });

    test("finalizes the build once every needs_review diff is approved", async ({
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "a" }],
      });
      await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      await bulkCastVote(mainBuild.id, reviewer.id, "approve");

      expect((await dbClient.builds.findById(mainBuild.id))?.reviewStatus).toBe("approved");
    });

    test("leaves a diff at needs_review when it still needs more distinct approvals than the bulk vote provides", async ({
      project,
      mainBuild,
      captureConfiguration,
      reviewer,
    }) => {
      await dbClient.projects.updateProject(project.id, { requiredReviewerCount: 2 });

      const [snapshotA, snapshotB] = await dbClient.snapshots.createMany({
        values: [
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "a" },
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "b" },
        ],
      });
      const alreadyApprovedOnceDiff = await dbClient.diffs.create({
        snapshotId: snapshotA!.id,
        reviewStatus: "needs_review",
      });
      const noVotesYetDiff = await dbClient.diffs.create({
        snapshotId: snapshotB!.id,
        reviewStatus: "needs_review",
      });

      const otherReviewer = await createUser();
      await dbClient.diffReviews.upsertVote({
        diffId: alreadyApprovedOnceDiff!.id,
        reviewerId: otherReviewer.id,
        vote: "approve",
      });

      await bulkCastVote(mainBuild.id, reviewer.id, "approve");

      expect(await dbClient.diffs.findById(alreadyApprovedOnceDiff!.id)).toMatchObject({
        reviewStatus: "approved",
      });
      expect(await dbClient.diffs.findById(noVotesYetDiff!.id)).toMatchObject({
        reviewStatus: "needs_review",
      });
    });
  });
});
