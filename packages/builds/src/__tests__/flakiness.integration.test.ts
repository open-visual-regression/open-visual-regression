import { Queue } from "bullmq";
import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";
import { QueueName, type FlakySnapshotScanJobPayload, type RedisConnection } from "@ovr/queue";

import {
  dispatchFlakySnapshotScans,
  getFlakyDetectionCron,
  scanFlakySnapshots,
} from "../flakiness";
import { describe, expect, test } from "./fixtures";

const dispatchAndCollectProjectIds = async (connection: RedisConnection): Promise<string[]> => {
  const queue = new Queue<FlakySnapshotScanJobPayload>(QueueName.FLAKY_SNAPSHOT_SCAN, {
    connection,
  });

  try {
    await dispatchFlakySnapshotScans();
    const waiting = await queue.getWaiting();
    return waiting.map((job) => job.data.projectId);
  } finally {
    await queue.obliterate({ force: true });
    await queue.close();
  }
};

describe("flakiness", () => {
  describe("dispatchFlakySnapshotScans", () => {
    test("queues a scan for a project with main-branch builds it has not scanned yet", async ({
      mainBuild,
      connection,
    }) => {
      vi.stubEnv("OVR_FLAKY_DETECTION_ENABLED", "true");

      expect(await dispatchAndCollectProjectIds(connection)).toContain(mainBuild.projectId);
    });

    test("skips a project with no main-branch activity since its last scan", async ({
      mainBuild,
      connection,
    }) => {
      vi.stubEnv("OVR_FLAKY_DETECTION_ENABLED", "true");
      await scanFlakySnapshots(mainBuild.projectId);

      expect(await dispatchAndCollectProjectIds(connection)).not.toContain(mainBuild.projectId);
    });

    test("skips a project whose only new builds are on feature branches", async ({
      featureBuild,
      connection,
    }) => {
      vi.stubEnv("OVR_FLAKY_DETECTION_ENABLED", "true");

      expect(await dispatchAndCollectProjectIds(connection)).not.toContain(featureBuild.projectId);
    });

    test("queues nothing when flaky detection is disabled", async ({ mainBuild, connection }) => {
      expect(await dispatchAndCollectProjectIds(connection)).not.toContain(mainBuild.projectId);
    });
  });

  describe("getFlakyDetectionCron", () => {
    test("runs hourly when no schedule is configured", () => {
      expect(getFlakyDetectionCron()).toBe("17 * * * *");
    });

    test("uses the configured schedule", () => {
      vi.stubEnv("OVR_FLAKY_DETECTION_CRON", "0 */6 * * *");

      expect(getFlakyDetectionCron()).toBe("0 */6 * * *");
    });

    test("falls back to hourly when the configured schedule is not a valid cron pattern", () => {
      vi.stubEnv("OVR_FLAKY_DETECTION_CRON", "hourly");

      expect(getFlakyDetectionCron()).toBe("17 * * * *");
    });
  });

  describe("scanFlakySnapshots", () => {
    test("flags a story that keeps returning to an earlier look on main", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      const variantIds: string[] = [];

      for (const [index, look] of [0, 1, 0, 1, 0].entries()) {
        const build = await dbClient.builds.create({
          projectId: project.id,
          branch: "main",
          commitSha: String(index).repeat(40),
          artifactPath: "builds/seed/artifact",
          createdBy: user.id,
          createdAt: new Date(Date.now() - (10 - index) * 60_000).toISOString(),
        });
        const [snapshot] = await dbClient.snapshots.createMany({
          values: [{ buildId: build!.id, ...captureConfiguration, targetId: "story-flaky" }],
        });
        variantIds[look] ??= (await dbClient.snapshotVariants.create({
          projectId: project.id,
          browser: captureConfiguration.browser,
          viewportWidth: captureConfiguration.viewportWidth,
          viewportHeight: captureConfiguration.viewportHeight,
          targetId: "story-flaky",
          snapshotId: snapshot!.id,
        }))!.id;
        await dbClient.snapshots.setVariant(snapshot!.id, variantIds[look]!);
      }

      await scanFlakySnapshots(project.id);

      expect(await dbClient.flakySnapshots.findByProject(project.id)).toEqual([
        expect.objectContaining({ targetId: "story-flaky", revertCount: 3 }),
      ]);
    });
  });
});
