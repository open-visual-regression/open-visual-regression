import { Queue } from "bullmq";

import { dbClient } from "@ovr/db/client";
import type { projects, user as userTable } from "@ovr/db/schema";
import { QueueName, type FlakySnapshotScanJobPayload, type RedisConnection } from "@ovr/queue";

import {
  dispatchFlakySnapshotScans,
  scanFlakySnapshots,
  scheduleFlakyDetection,
} from "../flakiness";
import { describe, enableFlakyDetection, expect, test, type Viewport } from "./fixtures";

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

const scheduleAndCollectPatterns = async (connection: RedisConnection): Promise<string[]> => {
  const queue = new Queue(QueueName.FLAKY_SNAPSHOT_DISPATCH, { connection });

  try {
    await scheduleFlakyDetection(connection);
    const schedulers = await queue.getJobSchedulers();
    return schedulers.map((scheduler) => scheduler.pattern ?? "");
  } finally {
    await queue.obliterate({ force: true });
    await queue.close();
  }
};

const seedCaptures = async (
  project: typeof projects.$inferSelect,
  user: typeof userTable.$inferSelect,
  captureConfiguration: Viewport,
  targetId: string,
  looks: number[],
): Promise<void> => {
  const variantIds: string[] = [];

  for (const [index, look] of looks.entries()) {
    const build = await dbClient.builds.create({
      projectId: project.id,
      branch: "main",
      commitSha: String(index).repeat(40),
      artifactPath: "builds/seed/artifact",
      createdBy: user.id,
      createdAt: new Date(Date.now() - (10 - index) * 60_000).toISOString(),
    });
    const [snapshot] = await dbClient.snapshots.createMany({
      values: [{ buildId: build!.id, ...captureConfiguration, targetId }],
    });
    variantIds[look] ??= (await dbClient.snapshotVariants.create({
      projectId: project.id,
      browser: captureConfiguration.browser,
      viewportWidth: captureConfiguration.viewportWidth,
      viewportHeight: captureConfiguration.viewportHeight,
      targetId,
      snapshotId: snapshot!.id,
    }))!.id;
    await dbClient.snapshots.setVariant(snapshot!.id, variantIds[look]!);
  }
};

describe("flakiness", () => {
  describe("dispatchFlakySnapshotScans", () => {
    test("queues a scan for a project with main-branch builds it has not scanned yet", async ({
      mainBuild,
      user,
      connection,
    }) => {
      await enableFlakyDetection(user.id);

      expect(await dispatchAndCollectProjectIds(connection)).toContain(mainBuild.projectId);
    });

    test("skips a project with no main-branch activity since its last scan", async ({
      mainBuild,
      user,
      connection,
    }) => {
      await enableFlakyDetection(user.id);
      await scanFlakySnapshots(mainBuild.projectId);

      expect(await dispatchAndCollectProjectIds(connection)).not.toContain(mainBuild.projectId);
    });

    test("skips a project whose only new builds are on feature branches", async ({
      featureBuild,
      user,
      connection,
    }) => {
      await enableFlakyDetection(user.id);

      expect(await dispatchAndCollectProjectIds(connection)).not.toContain(featureBuild.projectId);
    });

    test("queues nothing when flaky detection is disabled", async ({ mainBuild, connection }) => {
      expect(await dispatchAndCollectProjectIds(connection)).not.toContain(mainBuild.projectId);
    });
  });

  describe("scheduleFlakyDetection", () => {
    test("runs at 7am and 7pm when detection is enabled without a saved schedule", async ({
      user,
      connection,
    }) => {
      await enableFlakyDetection(user.id);

      expect(await scheduleAndCollectPatterns(connection)).toEqual(["0 7,19 * * *"]);
    });

    test("uses the saved schedule", async ({ user, connection }) => {
      await enableFlakyDetection(user.id, { cron: "0 */6 * * *" });

      expect(await scheduleAndCollectPatterns(connection)).toEqual(["0 */6 * * *"]);
    });

    test("falls back to 7am and 7pm when the saved schedule is not a valid cron pattern", async ({
      user,
      connection,
    }) => {
      await enableFlakyDetection(user.id, { cron: "hourly" });

      expect(await scheduleAndCollectPatterns(connection)).toEqual(["0 7,19 * * *"]);
    });

    test("does not schedule anything when flaky detection is disabled", async ({ connection }) => {
      expect(await scheduleAndCollectPatterns(connection)).toEqual([]);
    });
  });

  describe("scanFlakySnapshots", () => {
    test("flags a story that keeps returning to an earlier look on main", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      await seedCaptures(project, user, captureConfiguration, "story-flaky", [0, 1, 0, 1, 0]);

      await scanFlakySnapshots(project.id);

      expect(await dbClient.flakySnapshots.findByProject(project.id)).toEqual([
        expect.objectContaining({ targetId: "story-flaky", revertCount: 3 }),
      ]);
    });

    test("only considers the number of recent builds saved in settings", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      await seedCaptures(project, user, captureConfiguration, "story-flaky", [0, 1, 0, 1, 0]);
      await enableFlakyDetection(user.id, { windowBuilds: 2 });

      await scanFlakySnapshots(project.id);

      expect(await dbClient.flakySnapshots.findByProject(project.id)).toEqual([]);
    });
  });
});
