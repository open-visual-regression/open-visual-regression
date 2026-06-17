import { dbClient } from "@ovr/db/client";
import { Worker } from "bullmq";
import { QueueName, type DiffJobPayload } from "@ovr/queue";

import { handleCaptureFailed } from "../capture";
import { describe, expect, test } from "../../__tests__/fixtures";

describe("capture", () => {
  describe("handleCaptureFailed", () => {
    test("marks the snapshot errored and enqueues a diff job when it was the last capture in the build", async ({
      build,
      captureConfiguration,
      connection,
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

      await handleCaptureFailed({ data: { buildId: build.id, snapshotId: snapshot!.id } } as never);

      expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({ status: "error" });

      const worker = new Worker<DiffJobPayload>(QueueName.SNAPSHOT_DIFF, async (job) => job.data, {
        connection,
      });
      try {
        const job = await new Promise<DiffJobPayload>((resolve, reject) => {
          worker.on("completed", (job) => resolve(job.data));
          worker.on("failed", (_job, error) => reject(error));
        });
        expect(job.snapshotId).toBe(snapshot!.id);
      } finally {
        await worker.close();
      }
    });

    test("does not enqueue a diff job when other snapshots in the build are still pending", async ({
      build,
      captureConfiguration,
    }) => {
      const [erroredSnapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-a",
          },
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-b",
          },
        ],
      });

      await handleCaptureFailed({
        data: { buildId: build.id, snapshotId: erroredSnapshot!.id },
      } as never);

      expect(await dbClient.diffs.findByBuild(build.id)).toEqual([]);
    });
  });
});
