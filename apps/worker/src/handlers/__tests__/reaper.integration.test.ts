import { Queue } from "bullmq";

import { resolveStaleBuilds } from "@ovr/builds/reaper";
import { dbClient } from "@ovr/db/client";
import { QueueName, type CaptureGroupJobPayload, type RedisConnection } from "@ovr/queue";
import { enqueueCaptureGroup, enqueueDiff } from "@ovr/queue/producer";

import { describe, expect, test } from "../../__tests__/fixtures";

const STALE_MINUTES = 30;
const OLD_TIMESTAMP = "2020-01-01T00:00:00.000Z";

const findWaitingCaptureGroups = async (connection: RedisConnection, buildId: string) => {
  const queue = new Queue<CaptureGroupJobPayload>(QueueName.SNAPSHOT_CAPTURE, { connection });
  try {
    const jobs = await queue.getJobs(["waiting", "delayed", "prioritized", "paused"]);
    return jobs.filter((job) => job.data.buildId === buildId);
  } finally {
    await queue.close();
  }
};

const findDiffJob = async (connection: RedisConnection, diffId: string) => {
  const queue = new Queue(QueueName.SNAPSHOT_DIFF, { connection });
  try {
    return await queue.getJob(diffId);
  } finally {
    await queue.close();
  }
};

describe("reaper", () => {
  describe("resolveStaleBuilds", () => {
    test("should resolve a stalled build to error and mark its unfinished snapshots and diffs as error", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/stalled/artifact",
        createdBy: user.id,
        createdAt: OLD_TIMESTAMP,
        updatedAt: OLD_TIMESTAMP,
      });
      await dbClient.builds.updateProcessingStatus(build!.id, "processing");

      const [queuedSnapshot, processingSnapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build!.id,
            ...captureConfiguration,
            targetId: "story-a",
            status: "queued",
            updatedAt: OLD_TIMESTAMP,
          },
          {
            buildId: build!.id,
            ...captureConfiguration,
            targetId: "story-b",
            status: "processing",
            updatedAt: OLD_TIMESTAMP,
          },
        ],
      });
      const pendingDiff = await dbClient.diffs.create({
        snapshotId: processingSnapshot!.id,
        updatedAt: OLD_TIMESTAMP,
      });

      await resolveStaleBuilds(STALE_MINUTES);

      expect(await dbClient.builds.findById(build!.id)).toMatchObject({
        processingStatus: "error",
      });
      expect(await dbClient.snapshots.findById(queuedSnapshot!.id)).toMatchObject({
        status: "error",
      });
      expect(await dbClient.snapshots.findById(processingSnapshot!.id)).toMatchObject({
        status: "error",
      });
      expect(await dbClient.diffs.findById(pendingDiff!.id)).toMatchObject({
        processingStatus: "error",
      });
      expect(await dbClient.diffs.findBySnapshot(queuedSnapshot!.id)).toMatchObject({
        processingStatus: "error",
      });
      expect(await dbClient.diffs.hasAllDoneForBuild(build!.id)).toBe(true);
    });

    test("should remove the waiting capture and diff jobs of a build it errors", async ({
      project,
      user,
      captureConfiguration,
      connection,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/stalled-queue/artifact",
        createdBy: user.id,
        createdAt: OLD_TIMESTAMP,
        updatedAt: OLD_TIMESTAMP,
      });
      await dbClient.builds.updateProcessingStatus(build!.id, "processing");

      const [queuedSnapshot, capturedSnapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build!.id,
            ...captureConfiguration,
            targetId: "story-a",
            status: "queued",
            updatedAt: OLD_TIMESTAMP,
          },
          {
            buildId: build!.id,
            ...captureConfiguration,
            targetId: "story-b",
            status: "success",
            updatedAt: OLD_TIMESTAMP,
          },
        ],
      });
      const pendingDiff = await dbClient.diffs.create({
        snapshotId: capturedSnapshot!.id,
        updatedAt: OLD_TIMESTAMP,
      });

      await enqueueCaptureGroup({
        buildId: build!.id,
        browser: captureConfiguration.browser,
        snapshotIds: [queuedSnapshot!.id],
      });
      await enqueueDiff({ snapshotId: capturedSnapshot!.id, diffId: pendingDiff!.id });

      expect(await findWaitingCaptureGroups(connection, build!.id)).toHaveLength(1);
      expect(await findDiffJob(connection, pendingDiff!.id)).toBeDefined();

      await resolveStaleBuilds(STALE_MINUTES);

      expect(await dbClient.builds.findById(build!.id)).toMatchObject({
        processingStatus: "error",
      });
      expect(await findWaitingCaptureGroups(connection, build!.id)).toHaveLength(0);
      expect(await findDiffJob(connection, pendingDiff!.id)).toBeUndefined();
    });

    test("should leave an actively-processing build untouched", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/active/artifact",
        createdBy: user.id,
        createdAt: OLD_TIMESTAMP,
        updatedAt: OLD_TIMESTAMP,
      });
      await dbClient.builds.updateProcessingStatus(build!.id, "processing");

      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build!.id,
            ...captureConfiguration,
            targetId: "story-a",
            status: "processing",
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      await resolveStaleBuilds(STALE_MINUTES);

      expect(await dbClient.builds.findById(build!.id)).toMatchObject({
        processingStatus: "processing",
      });
      expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({
        status: "processing",
      });
    });
  });
});
