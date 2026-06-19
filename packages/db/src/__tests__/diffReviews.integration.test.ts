import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

describe("diffReviews", () => {
  describe("upsertVote", () => {
    test("should create a vote", async ({ build, captureConfiguration, user }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
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
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
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
        values: [
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
        ],
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
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
          { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "b" },
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
});
