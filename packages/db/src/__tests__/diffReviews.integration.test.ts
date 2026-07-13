import { v7 as uuidv7 } from "uuid";

import { dbClient } from "../client";
import { db } from "../db";
import { user as userTable } from "../schema";
import { describe, expect, test } from "./fixtures";

describe("diffReviews", () => {
  describe("upsertVote", () => {
    test("should create a vote", async ({ build, captureConfiguration, user }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      const vote = await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: user.id,
        vote: "approve",
      });

      expect(vote).toMatchObject({ diffId: diff!.id, reviewerId: user.id, vote: "approve" });
    });

    test("should replace the reviewer's existing vote instead of duplicating it", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: user.id,
        vote: "approve",
      });
      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: user.id,
        vote: "reject",
      });

      const votes = await dbClient.diffReviews.findByDiff(diff!.id);
      expect(votes).toHaveLength(1);
      expect(votes[0]).toMatchObject({ vote: "reject" });
    });
  });

  describe("removeVote", () => {
    test("should delete the reviewer's vote", async ({ build, captureConfiguration, user }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });
      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: user.id,
        vote: "approve",
      });

      await dbClient.diffReviews.removeVote(diff!.id, user.id);

      expect(await dbClient.diffReviews.findByDiff(diff!.id)).toEqual([]);
    });
  });

  describe("findByDiff", () => {
    test("should return only votes for the given diff", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshotA, snapshotB] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...captureConfiguration, targetId: "a" },
          { buildId: build.id, ...captureConfiguration, targetId: "b" },
        ],
      });
      const diffA = await dbClient.diffs.create({ snapshotId: snapshotA!.id });
      const diffB = await dbClient.diffs.create({ snapshotId: snapshotB!.id });

      await dbClient.diffReviews.upsertVote({
        diffId: diffA!.id,
        reviewerId: user.id,
        vote: "approve",
      });
      await dbClient.diffReviews.upsertVote({
        diffId: diffB!.id,
        reviewerId: user.id,
        vote: "reject",
      });

      const votes = await dbClient.diffReviews.findByDiff(diffA!.id);
      expect(votes.map((vote) => vote.diffId)).toEqual([diffA!.id]);
    });
  });

  describe("findByDiff with withReviewers", () => {
    test("joins each vote with the reviewer profile", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });
      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: user.id,
        vote: "approve",
      });

      const [review] = await dbClient.diffReviews.findByDiff(diff!.id, { withReviewers: true });

      expect(review).toMatchObject({
        reviewerId: user.id,
        vote: "approve",
        reviewer: { id: user.id, name: user.name, image: user.image },
      });
    });

    test("returns only the reviews for the given diff", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshotA, snapshotB] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...captureConfiguration, targetId: "a" },
          { buildId: build.id, ...captureConfiguration, targetId: "b" },
        ],
      });
      const diffA = await dbClient.diffs.create({ snapshotId: snapshotA!.id });
      const diffB = await dbClient.diffs.create({ snapshotId: snapshotB!.id });
      await dbClient.diffReviews.upsertVote({
        diffId: diffA!.id,
        reviewerId: user.id,
        vote: "approve",
      });
      await dbClient.diffReviews.upsertVote({
        diffId: diffB!.id,
        reviewerId: user.id,
        vote: "reject",
      });

      const reviews = await dbClient.diffReviews.findByDiff(diffA!.id, { withReviewers: true });

      expect(reviews.map((review) => review.diffId)).toEqual([diffA!.id]);
    });

    test("orders reviews by reviewedAt ascending", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [secondReviewer] = await db
        .insert(userTable)
        .values({ id: uuidv7(), name: "Second Reviewer", email: `${uuidv7()}@example.com` })
        .returning();
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });
      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: user.id,
        vote: "approve",
      });
      await dbClient.diffReviews.upsertVote({
        diffId: diff!.id,
        reviewerId: secondReviewer!.id,
        vote: "reject",
      });

      const reviews = await dbClient.diffReviews.findByDiff(diff!.id, { withReviewers: true });

      expect(reviews).toHaveLength(2);
      const timestamps = reviews.map((review) => review.reviewedAt);
      expect([...timestamps].sort()).toEqual(timestamps);
    });

    test("returns an empty array when the diff has no reviews", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      expect(await dbClient.diffReviews.findByDiff(diff!.id, { withReviewers: true })).toEqual([]);
    });
  });
});
