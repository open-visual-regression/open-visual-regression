import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

describe("baselineRevisions", () => {
  describe("findFirstAfter", () => {
    test("should find the first change main made to a target after the given time", async ({
      project,
      captureConfiguration,
      build,
    }) => {
      const [previous] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "target-a" }],
      });
      const key = { projectId: project.id, ...captureConfiguration, targetId: "target-a" };
      await dbClient.baselineRevisions.create({
        ...key,
        buildId: build.id,
        previousSnapshotId: null,
        replacedExisting: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      const first = await dbClient.baselineRevisions.create({
        ...key,
        buildId: build.id,
        previousSnapshotId: previous!.id,
        replacedExisting: true,
        createdAt: "2026-01-03T00:00:00.000Z",
      });
      await dbClient.baselineRevisions.create({
        ...key,
        buildId: build.id,
        previousSnapshotId: null,
        replacedExisting: true,
        createdAt: "2026-01-05T00:00:00.000Z",
      });

      const revision = await dbClient.baselineRevisions.findFirstAfter(
        key,
        "2026-01-02T00:00:00.000Z",
      );

      expect(revision).toMatchObject({ id: first!.id, previousSnapshotId: previous!.id });
    });

    test("should find nothing when main hasn't changed the target since the given time", async ({
      project,
      captureConfiguration,
      build,
    }) => {
      const key = { projectId: project.id, ...captureConfiguration, targetId: "target-a" };
      await dbClient.baselineRevisions.create({
        ...key,
        buildId: build.id,
        previousSnapshotId: null,
        replacedExisting: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      await dbClient.baselineRevisions.create({
        ...key,
        targetId: "target-b",
        buildId: build.id,
        previousSnapshotId: null,
        replacedExisting: false,
        createdAt: "2026-01-03T00:00:00.000Z",
      });

      const revision = await dbClient.baselineRevisions.findFirstAfter(
        key,
        "2026-01-02T00:00:00.000Z",
      );

      expect(revision).toBeUndefined();
    });
  });

  describe("retention", () => {
    test("should be removed along with the build that made the change", async ({
      project,
      captureConfiguration,
      build,
    }) => {
      const key = { projectId: project.id, ...captureConfiguration, targetId: "target-a" };
      await dbClient.baselineRevisions.create({
        ...key,
        buildId: build.id,
        previousSnapshotId: null,
        replacedExisting: false,
        createdAt: build.createdAt,
      });

      await dbClient.transaction((tx) => dbClient.builds.removeMany(tx, [build.id]));

      expect(
        await dbClient.baselineRevisions.findFirstAfter(key, "2000-01-01T00:00:00.000Z"),
      ).toBeUndefined();
    });

    test("should keep the change, without its previous snapshot, once that snapshot's build is purged", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [previous] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "target-a" }],
      });
      const changingBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/changing/artifact",
        createdBy: user.id,
      });
      const key = { projectId: project.id, ...captureConfiguration, targetId: "target-a" };
      await dbClient.baselineRevisions.create({
        ...key,
        buildId: changingBuild!.id,
        previousSnapshotId: previous!.id,
        replacedExisting: true,
        createdAt: changingBuild!.createdAt,
      });

      await dbClient.transaction((tx) => dbClient.builds.removeMany(tx, [build.id]));

      expect(
        await dbClient.baselineRevisions.findFirstAfter(key, "2000-01-01T00:00:00.000Z"),
      ).toMatchObject({ previousSnapshotId: null, replacedExisting: true });
    });
  });
});
