import { dbClient } from "@ovr/db/client";

import { getBaseline, promoteBaseline } from "../baselines";
import { describe, expect, test } from "./fixtures";

describe("baselines", () => {
  describe("getBaseline", () => {
    test("returns undefined when no baseline exists", async ({ project, captureConfiguration }) => {
      const result = await getBaseline(project.id, captureConfiguration.id, "story-a");

      expect(result).toBeUndefined();
    });

    test("returns the upserted baseline", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-a",
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        captureConfigurationId: captureConfiguration.id,
        targetId: "story-a",
        snapshotId: snapshot!.id,
        approvedBy: user.id,
      });

      const result = await getBaseline(project.id, captureConfiguration.id, "story-a");

      expect(result).toMatchObject({ snapshotId: snapshot!.id });
    });
  });

  describe("promoteBaseline", () => {
    test("upserts a baseline when the build is on the project's default branch", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-a",
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await promoteBaseline(diff!.id, user.id);

      const baseline = await getBaseline(project.id, captureConfiguration.id, "story-a");
      expect(baseline).toMatchObject({ snapshotId: snapshot!.id, approvedBy: user.id });
    });

    test("does not upsert a baseline for a feature branch build", async ({
      project,
      captureConfiguration,
      user,
    }) => {
      const featureBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "feature/x",
        commitSha: "b".repeat(40),
        artifactPath: "builds/feature/artifact",
        createdBy: user.id,
      });
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: featureBuild!.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-b",
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await promoteBaseline(diff!.id, user.id);

      const baseline = await getBaseline(project.id, captureConfiguration.id, "story-b");
      expect(baseline).toBeUndefined();
    });
  });
});
