import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

describe("snapshots", () => {
  describe("createMany", () => {
    test("should create a snapshot for each input row", async ({ build, captureConfiguration }) => {
      const created = await dbClient.snapshots.createMany([
        {
          buildId: build.id,
          captureConfigurationId: captureConfiguration.id,
          storyId: "button--primary",
        },
        {
          buildId: build.id,
          captureConfigurationId: captureConfiguration.id,
          storyId: "button--secondary",
        },
      ]);

      expect(created).toHaveLength(2);
    });
  });

  describe("findByBuild", () => {
    test("should return all snapshots belonging to the build", async ({
      build,
      captureConfiguration,
    }) => {
      await dbClient.snapshots.createMany([
        {
          buildId: build.id,
          captureConfigurationId: captureConfiguration.id,
          storyId: "button--primary",
        },
        {
          buildId: build.id,
          captureConfigurationId: captureConfiguration.id,
          storyId: "button--secondary",
        },
      ]);

      const found = await dbClient.snapshots.findByBuild(build.id);
      expect(found).toHaveLength(2);
    });
  });

  describe("countByBuild", () => {
    test("should return the number of snapshots belonging to the build", async ({
      build,
      captureConfiguration,
    }) => {
      await dbClient.snapshots.createMany([
        {
          buildId: build.id,
          captureConfigurationId: captureConfiguration.id,
          storyId: "button--primary",
        },
        {
          buildId: build.id,
          captureConfigurationId: captureConfiguration.id,
          storyId: "button--secondary",
        },
      ]);

      expect(await dbClient.snapshots.countByBuild(build.id)).toBe(2);
    });
  });

  describe("updateStatus", () => {
    test("should update a snapshot's status", async ({ build, captureConfiguration }) => {
      const [snapshot] = await dbClient.snapshots.createMany([
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, storyId: "a" },
      ]);

      const updated = await dbClient.snapshots.updateStatus(snapshot!.id, "captured");
      expect(updated?.status).toBe("captured");
    });
  });

  describe("hasAllCapturedForBuild", () => {
    test("should return false while any snapshot is still pending", async ({
      build,
      captureConfiguration,
    }) => {
      const [a] = await dbClient.snapshots.createMany([
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, storyId: "a" },
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, storyId: "b" },
      ]);

      await dbClient.snapshots.updateStatus(a!.id, "captured");
      expect(await dbClient.snapshots.hasAllCapturedForBuild(build.id)).toBe(false);
    });

    test("should return true once every snapshot has been captured or errored", async ({
      build,
      captureConfiguration,
    }) => {
      const created = await dbClient.snapshots.createMany([
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, storyId: "a" },
        { buildId: build.id, captureConfigurationId: captureConfiguration.id, storyId: "b" },
      ]);

      await dbClient.snapshots.updateStatus(created[0]!.id, "captured");
      await dbClient.snapshots.updateStatus(created[1]!.id, "error");
      expect(await dbClient.snapshots.hasAllCapturedForBuild(build.id)).toBe(true);
    });

    test("should return false for a build with no snapshots", async ({ build }) => {
      expect(await dbClient.snapshots.hasAllCapturedForBuild(build.id)).toBe(false);
    });
  });
});
