import { resolveStaleBuilds } from "@ovr/builds/reaper";
import { dbClient } from "@ovr/db/client";

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
