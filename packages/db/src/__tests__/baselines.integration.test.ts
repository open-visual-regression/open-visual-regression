import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

describe("baselines", () => {
  describe("upsert", () => {
    test("should create a baseline when none exists", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
        ],
      });

      const created = await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: snapshot!.id,
        approvedBy: user.id,
      });

      expect(created?.snapshotId).toBe(snapshot!.id);
    });

    test("should replace the existing baseline for the same project, capture configuration, and story", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [snapshotA, snapshotB] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
        ],
      });

      const created = await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: snapshotA!.id,
        approvedBy: user.id,
      });

      const replaced = await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: snapshotB!.id,
        approvedBy: user.id,
      });

      expect(replaced?.id).toBe(created?.id);
      expect(replaced?.snapshotId).toBe(snapshotB!.id);
    });

    test("should keep the baseline from a newer build when an older build is promoted after it", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const newerBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/seed/artifact",
        createdBy: user.id,
      });
      const [olderSnapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "button--primary" }],
      });
      const [newerSnapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: newerBuild!.id, ...captureConfiguration, targetId: "button--primary" }],
      });

      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: newerSnapshot!.id,
        approvedBy: user.id,
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: olderSnapshot!.id,
        approvedBy: user.id,
      });

      const found = await dbClient.baselines.find({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
      });
      expect(found?.snapshotId).toBe(newerSnapshot!.id);
    });
  });

  describe("find", () => {
    test("should return the baseline matching the project, capture configuration, and story", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: snapshot!.id,
        approvedBy: user.id,
      });

      const found = await dbClient.baselines.find({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
      });
      expect(found?.snapshotId).toBe(snapshot!.id);
    });
  });

  describe("findByProject", () => {
    test("should return all baselines for the project", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: snapshot!.id,
        approvedBy: user.id,
      });

      const all = await dbClient.baselines.findByProject(project.id);
      expect(all).toHaveLength(1);
    });
  });
});
