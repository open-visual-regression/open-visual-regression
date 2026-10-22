import { resolveStaleBuilds } from "@ovr/builds/reaper";
import { dbClient } from "@ovr/db/client";
import { QueueName } from "@ovr/queue";
import { enqueueCaptureGroup, enqueueCaptureGroups, enqueueFinalize } from "@ovr/queue/producer";

import { describe, expect, test } from "../../__tests__/fixtures";

const STALE_MINUTES = 30;
const OLD_TIMESTAMP = "2020-01-01T00:00:00.000Z";

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

    test("should leave a build untouched while its capture groups wait behind a long backlog", async ({
      project,
      user,
      captureConfiguration,
      trackJob,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "feature",
        commitSha: "a".repeat(40),
        artifactPath: "builds/backlogged/artifact",
        createdBy: user.id,
        createdAt: OLD_TIMESTAMP,
        updatedAt: OLD_TIMESTAMP,
      });
      await dbClient.builds.updateProcessingStatus(build!.id, "processing");
      const [queuedSnapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build!.id,
            ...captureConfiguration,
            targetId: "story-a",
            status: "queued",
            updatedAt: OLD_TIMESTAMP,
          },
        ],
      });
      const [captureGroup] = (
        await enqueueCaptureGroups(build!.id, [
          { browser: captureConfiguration.browser, snapshotIds: [queuedSnapshot!.id] },
        ])
      ).map(trackJob);

      await resolveStaleBuilds(STALE_MINUTES);

      expect(await dbClient.builds.findById(build!.id)).toMatchObject({
        processingStatus: "processing",
      });
      expect(await dbClient.snapshots.findById(queuedSnapshot!.id)).toMatchObject({
        status: "queued",
      });
      expect(await captureGroup!.getState()).toBe("prioritized");
    });

    test("should leave a build untouched while a diff job waits out its retry backoff", async ({
      project,
      user,
      captureConfiguration,
      openQueue,
      trackJob,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/retrying/artifact",
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
            status: "success",
            updatedAt: OLD_TIMESTAMP,
          },
        ],
      });
      const pendingDiff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        updatedAt: OLD_TIMESTAMP,
      });
      const retryingDiff = trackJob(
        await openQueue(QueueName.SNAPSHOT_DIFF).add(
          QueueName.SNAPSHOT_DIFF,
          { snapshotId: snapshot!.id, diffId: pendingDiff!.id },
          { jobId: pendingDiff!.id, delay: 60_000 },
        ),
      );

      await resolveStaleBuilds(STALE_MINUTES);

      expect(await dbClient.builds.findById(build!.id)).toMatchObject({
        processingStatus: "processing",
      });
      expect(await retryingDiff.getState()).toBe("delayed");
    });

    test("should leave a build untouched when only its finalize job is left to run", async ({
      project,
      user,
      captureConfiguration,
      trackJob,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/finalizing/artifact",
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
            status: "success",
            updatedAt: OLD_TIMESTAMP,
          },
        ],
      });
      await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        processingStatus: "success",
        updatedAt: OLD_TIMESTAMP,
      });
      trackJob(await enqueueFinalize({ buildId: build!.id }));

      await resolveStaleBuilds(STALE_MINUTES);

      expect(await dbClient.builds.findById(build!.id)).toMatchObject({
        processingStatus: "processing",
      });
    });

    test("should resolve an idle build whose jobs are gone, even with a diff still pending", async ({
      project,
      user,
      captureConfiguration,
      trackJob,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/orphaned/artifact",
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
            status: "success",
            updatedAt: OLD_TIMESTAMP,
          },
        ],
      });
      const pendingDiff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        updatedAt: OLD_TIMESTAMP,
      });
      trackJob(
        await enqueueCaptureGroup({
          buildId: "other-build",
          browser: captureConfiguration.browser,
          snapshotIds: [],
        }),
      );

      await resolveStaleBuilds(STALE_MINUTES);

      expect(await dbClient.builds.findById(build!.id)).toMatchObject({
        processingStatus: "error",
        errorMessage: `Build timed out: no processing activity for ${STALE_MINUTES} minutes`,
      });
      expect(await dbClient.diffs.findById(pendingDiff!.id)).toMatchObject({
        processingStatus: "error",
      });
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
