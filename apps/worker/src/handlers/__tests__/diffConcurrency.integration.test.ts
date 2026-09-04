import { dbClient } from "@ovr/db/client";

import { describe, expect, test } from "../../__tests__/fixtures";
import { run } from "../diff";

describe("diff", () => {
  describe("run", () => {
    test("should settle every snapshot and promote its baseline when a build's diffs run in parallel", async ({
      build,
      project,
      captureConfiguration,
    }) => {
      const targetIds = ["story-a", "story-b", "story-c", "story-d"];
      const snapshots = await dbClient.snapshots.createMany({
        values: targetIds.map((targetId) => ({
          buildId: build.id,
          ...captureConfiguration,
          targetId,
          status: "success" as const,
          imagePath: `${build.projectId}/builds/${build.id}/snapshots/${targetId}.png`,
        })),
      });

      const diffs = await Promise.all(
        snapshots.map((snapshot) => dbClient.diffs.create({ snapshotId: snapshot!.id })),
      );

      await Promise.all(
        diffs.map((diff) => run({ data: { snapshotId: diff!.snapshotId, diffId: diff!.id } })),
      );

      for (const diff of diffs) {
        expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
          processingStatus: "success",
          reviewStatus: "auto_approved",
        });
      }

      const baselines = await dbClient.baselines.findByProject(project.id);
      expect(baselines.map((baseline) => baseline.targetId).sort()).toEqual(targetIds);
      expect(baselines.map((baseline) => baseline.snapshotId).sort()).toEqual(
        snapshots.map((snapshot) => snapshot!.id).sort(),
      );
    });
  });
});
