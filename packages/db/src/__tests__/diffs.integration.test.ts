import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

describe("diffs", () => {
  describe("create", () => {
    test("should create a diff with pending status", async ({ build, captureConfiguration }) => {
      const [snapshot] = await dbClient.snapshots.createMany([
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
      ]);

      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });
      expect(diff?.status).toBe("pending");
    });
  });

  describe("findById", () => {
    test("should return the diff matching the given id", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany([
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
      ]);
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
      const [snapshot] = await dbClient.snapshots.createMany([
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
      ]);
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      const found = await dbClient.diffs.findByBuild(build.id);
      expect(found.map((d) => d.id)).toEqual([diff!.id]);
    });
  });

  describe("updateStatus", () => {
    test("should update the diff's status", async ({ build, captureConfiguration }) => {
      const [snapshot] = await dbClient.snapshots.createMany([
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
      ]);
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      const updated = await dbClient.diffs.updateStatus(diff!.id, "auto_approved");
      expect(updated?.status).toBe("auto_approved");
    });
  });

  describe("updateReview", () => {
    test("should update the diff's reviewer, status, and reviewedAt", async ({
      build,
      captureConfiguration,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany([
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
      ]);
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        status: "needs_review",
      });

      const reviewed = await dbClient.diffs.updateReview(diff!.id, {
        reviewerId: user.id,
        reviewedAt: new Date().toISOString(),
        status: "approved",
      });

      expect(reviewed?.status).toBe("approved");
      expect(reviewed?.reviewerId).toBe(user.id);
      expect(reviewed?.reviewedAt).toBeTruthy();
    });
  });

  describe("hasAllDoneForBuild", () => {
    test("should return false while any diff is still pending", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany([
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
      ]);
      await dbClient.diffs.create({ snapshotId: snapshot!.id });

      expect(await dbClient.diffs.hasAllDoneForBuild(build.id)).toBe(false);
    });

    test("should return true once every diff for the build is resolved", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany([
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, targetId: "a" },
      ]);
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await dbClient.diffs.updateStatus(diff!.id, "auto_approved");
      expect(await dbClient.diffs.hasAllDoneForBuild(build.id)).toBe(true);
    });

    test("should return false for a build with no diffs", async ({ build }) => {
      expect(await dbClient.diffs.hasAllDoneForBuild(build.id)).toBe(false);
    });
  });
});
