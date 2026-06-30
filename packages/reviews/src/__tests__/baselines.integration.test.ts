import { dbClient } from "@ovr/db/client";

import { getBaseline, promoteBaseline } from "../baselines";
import { describe, expect, test } from "./fixtures";

describe("baselines", () => {
  describe("getBaseline", () => {
    test("should have nothing to compare a story against until a reviewer has approved one", async ({
      project,
      captureConfiguration,
    }) => {
      const result = await getBaseline(project.id, captureConfiguration, "story-a");

      expect(result).toBeUndefined();
    });

    test("should compare future stories against the one a reviewer most recently approved", async ({
      project,
      captureConfiguration,
      mainBuild,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-a",
        snapshotId: snapshot!.id,
        approvedBy: user.id,
      });

      const result = await getBaseline(project.id, captureConfiguration, "story-a");

      expect(result).toMatchObject({ snapshotId: snapshot!.id });
    });
  });

  describe("promoteBaseline", () => {
    test("should let a reviewer's approval set the new baseline when the build is on the project's default branch", async ({
      project,
      captureConfiguration,
      mainBuild,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await promoteBaseline(diff!.id, user.id);

      const baseline = await getBaseline(project.id, captureConfiguration, "story-a");
      expect(baseline).toMatchObject({ snapshotId: snapshot!.id, approvedBy: user.id });
    });

    test("should not let an approval on a feature branch change what future stories are compared against", async ({
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
            ...captureConfiguration,
            targetId: "story-b",
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await promoteBaseline(diff!.id, user.id);

      const baseline = await getBaseline(project.id, captureConfiguration, "story-b");
      expect(baseline).toBeUndefined();
    });
  });
});
