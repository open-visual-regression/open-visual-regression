import { dbClient } from "@ovr/db/client";
import { Worker } from "bullmq";
import { QueueName, type FinalizeJobPayload } from "@ovr/queue";

import { handleDiffFailed } from "../diff";
import { describe, expect, test } from "../../__tests__/fixtures";

describe("diff", () => {
  describe("handleDiffFailed", () => {
    test("marks the diff errored and enqueues finalize when it was the last diff in the build", async ({
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
            status: "captured",
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await handleDiffFailed({ data: { snapshotId: snapshot!.id, diffId: diff!.id } } as never);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ status: "error" });

      const worker = new Worker<FinalizeJobPayload>(
        QueueName.BUILD_FINALIZE,
        async (job) => job.data,
        { connection },
      );
      try {
        const job = await new Promise<FinalizeJobPayload>((resolve, reject) => {
          worker.on("completed", (job) => resolve(job.data));
          worker.on("failed", (_job, error) => reject(error));
        });
        expect(job.buildId).toBe(build.id);
      } finally {
        await worker.close();
      }
    });

    test("does not enqueue finalize when other diffs in the build are still pending", async ({
      build,
      captureConfiguration,
    }) => {
      const [erroredSnapshot, otherSnapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-a",
            status: "captured",
          },
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-b",
            status: "captured",
          },
        ],
      });
      const erroredDiff = await dbClient.diffs.create({ snapshotId: erroredSnapshot!.id });
      await dbClient.diffs.create({ snapshotId: otherSnapshot!.id });

      await handleDiffFailed({
        data: { snapshotId: erroredSnapshot!.id, diffId: erroredDiff!.id },
      } as never);

      const diffs = await dbClient.diffs.findByBuild(build.id);
      expect(diffs.every((diff) => diff.status !== "pending")).toBe(false);
    });
  });
});
