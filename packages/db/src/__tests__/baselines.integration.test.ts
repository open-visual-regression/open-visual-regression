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
      const [snapshot] = await dbClient.snapshots.createMany([
        {
          buildId: build.id,
          captureConfigurationId: captureConfiguration.id,
          targetId: "button--primary",
        },
      ]);

      const created = await dbClient.baselines.upsert({
        projectId: project.id,
        captureConfigurationId: captureConfiguration.id,
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
      const [snapshotA, snapshotB] = await dbClient.snapshots.createMany([
        {
          buildId: build.id,
          captureConfigurationId: captureConfiguration.id,
          targetId: "button--primary",
        },
        {
          buildId: build.id,
          captureConfigurationId: captureConfiguration.id,
          targetId: "button--primary",
        },
      ]);

      const created = await dbClient.baselines.upsert({
        projectId: project.id,
        captureConfigurationId: captureConfiguration.id,
        targetId: "button--primary",
        snapshotId: snapshotA!.id,
        approvedBy: user.id,
      });

      const replaced = await dbClient.baselines.upsert({
        projectId: project.id,
        captureConfigurationId: captureConfiguration.id,
        targetId: "button--primary",
        snapshotId: snapshotB!.id,
        approvedBy: user.id,
      });

      expect(replaced?.id).toBe(created?.id);
      expect(replaced?.snapshotId).toBe(snapshotB!.id);
    });
  });

  describe("find", () => {
    test("should return the baseline matching the project, capture configuration, and story", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany([
        {
          buildId: build.id,
          captureConfigurationId: captureConfiguration.id,
          targetId: "button--primary",
        },
      ]);
      await dbClient.baselines.upsert({
        projectId: project.id,
        captureConfigurationId: captureConfiguration.id,
        targetId: "button--primary",
        snapshotId: snapshot!.id,
        approvedBy: user.id,
      });

      const found = await dbClient.baselines.find(
        project.id,
        captureConfiguration.id,
        "button--primary",
      );
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
      const [snapshot] = await dbClient.snapshots.createMany([
        {
          buildId: build.id,
          captureConfigurationId: captureConfiguration.id,
          targetId: "button--primary",
        },
      ]);
      await dbClient.baselines.upsert({
        projectId: project.id,
        captureConfigurationId: captureConfiguration.id,
        targetId: "button--primary",
        snapshotId: snapshot!.id,
        approvedBy: user.id,
      });

      const all = await dbClient.baselines.findByProject(project.id);
      expect(all).toHaveLength(1);
    });
  });
});
