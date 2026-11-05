import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

describe("baselineRevisions", () => {
  describe("findFirstAfter", () => {
    test("should find the first change main made to a target after the given time", async ({
      project,
      captureConfiguration,
      build,
      recordRevision,
    }) => {
      const [previous] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "target-a" }],
      });
      await recordRevision({ createdAt: "2026-01-01T00:00:00.000Z" });
      const first = await recordRevision({
        previousSnapshotId: previous!.id,
        replacedExisting: true,
        createdAt: "2026-01-03T00:00:00.000Z",
      });
      await recordRevision({ replacedExisting: true, createdAt: "2026-01-05T00:00:00.000Z" });

      const revision = await dbClient.baselineRevisions.findFirstAfter(
        { projectId: project.id, ...captureConfiguration, targetId: "target-a" },
        "2026-01-02T00:00:00.000Z",
      );

      expect(revision).toMatchObject({ id: first.id, previousSnapshotId: previous!.id });
    });

    test("should find nothing when main hasn't changed the target since the given time", async ({
      project,
      captureConfiguration,
      recordRevision,
    }) => {
      await recordRevision({ createdAt: "2026-01-01T00:00:00.000Z" });
      await recordRevision({ targetId: "target-b", createdAt: "2026-01-03T00:00:00.000Z" });

      const revision = await dbClient.baselineRevisions.findFirstAfter(
        { projectId: project.id, ...captureConfiguration, targetId: "target-a" },
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
      recordRevision,
    }) => {
      await recordRevision();

      await dbClient.transaction((tx) => dbClient.builds.removeMany(tx, [build.id]));

      expect(
        await dbClient.baselineRevisions.findFirstAfter(
          { projectId: project.id, ...captureConfiguration, targetId: "target-a" },
          "2000-01-01T00:00:00.000Z",
        ),
      ).toBeUndefined();
    });

    test("should keep the change, without its previous snapshot, once that snapshot's build is purged", async ({
      project,
      captureConfiguration,
      build,
      user,
      recordRevision,
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
      await recordRevision({
        buildId: changingBuild!.id,
        previousSnapshotId: previous!.id,
        replacedExisting: true,
        createdAt: changingBuild!.createdAt,
      });

      await dbClient.transaction((tx) => dbClient.builds.removeMany(tx, [build.id]));

      expect(
        await dbClient.baselineRevisions.findFirstAfter(
          { projectId: project.id, ...captureConfiguration, targetId: "target-a" },
          "2000-01-01T00:00:00.000Z",
        ),
      ).toMatchObject({ previousSnapshotId: null, replacedExisting: true });
    });
  });
});
