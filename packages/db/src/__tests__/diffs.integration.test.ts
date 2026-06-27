import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

describe("diffs", () => {
  describe("create", () => {
    test("should create a diff with pending/not_required defaults", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });

      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });
      expect(diff?.processingStatus).toBe("pending");
      expect(diff?.reviewStatus).toBe("not_required");
    });
  });

  describe("findById", () => {
    test("should return the diff matching the given id", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      const found = await dbClient.diffs.findById(diff!.id);
      expect(found?.id).toBe(diff!.id);
    });
  });

  describe("findByBuild", () => {
    test("should return all diffs for snapshots belonging to the build", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      const found = await dbClient.diffs.findByBuild(build.id);
      expect(found.map((d) => d.id)).toEqual([diff!.id]);
    });
  });

  describe("findBySnapshotWithBaseline", () => {
    test("should return the diff with its joined baseline snapshot", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot, baselineSnapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...captureConfiguration, targetId: "a", imagePath: "new.png" },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "a",
            imagePath: "baseline.png",
          },
        ],
      });
      await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        baselineSnapshotId: baselineSnapshot!.id,
      });

      const found = await dbClient.diffs.findBySnapshotWithBaseline(snapshot!.id);

      expect(found?.diff.snapshotId).toBe(snapshot!.id);
      expect(found?.baselineSnapshot?.imagePath).toBe("baseline.png");
    });

    test("should return a null baseline snapshot when the diff has no baseline", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      await dbClient.diffs.create({ snapshotId: snapshot!.id });

      const found = await dbClient.diffs.findBySnapshotWithBaseline(snapshot!.id);

      expect(found?.baselineSnapshot).toBeNull();
    });
  });

  describe("updateProcessingStatus", () => {
    test("should update the diff's processing status", async ({ build, captureConfiguration }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      const updated = await dbClient.diffs.updateProcessingStatus(diff!.id, "success");
      expect(updated?.processingStatus).toBe("success");
    });
  });

  describe("updateResult", () => {
    test("should update the diff's processing/review status and pixel diff fields", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      const updated = await dbClient.diffs.updateResult(diff!.id, {
        processingStatus: "success",
        reviewStatus: "needs_review",
        pixelDiffCount: 12,
        diffPercent: 0.5,
      });

      expect(updated).toMatchObject({
        processingStatus: "success",
        reviewStatus: "needs_review",
        pixelDiffCount: 12,
        diffPercent: 0.5,
      });
    });
  });

  describe("updateReviewStatus", () => {
    test("should update the diff's review status", async ({ build, captureConfiguration }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "needs_review",
      });

      const updated = await dbClient.diffs.updateReviewStatus(diff!.id, "approved");
      expect(updated?.reviewStatus).toBe("approved");
    });
  });

  describe("hasAllDoneForBuild", () => {
    test("should return false while any diff is still pending", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      await dbClient.diffs.create({ snapshotId: snapshot!.id });

      expect(await dbClient.diffs.hasAllDoneForBuild(build.id)).toBe(false);
    });

    test("should return true once every diff for the build has finished processing", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await dbClient.diffs.updateProcessingStatus(diff!.id, "success");
      expect(await dbClient.diffs.hasAllDoneForBuild(build.id)).toBe(true);
    });

    test("should return false for a build with no diffs", async ({ build }) => {
      expect(await dbClient.diffs.hasAllDoneForBuild(build.id)).toBe(false);
    });
  });
});
