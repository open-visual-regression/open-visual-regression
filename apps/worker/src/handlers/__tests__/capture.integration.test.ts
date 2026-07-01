import { Worker } from "bullmq";

import { dbClient } from "@ovr/db/client";
import { QueueName, type DiffJobPayload } from "@ovr/queue";

import { describe, expect, test } from "../../__tests__/fixtures";
import { failed } from "../capture";

describe("capture", () => {
  describe("failed", () => {
    test("should still move the build toward a diff when a story can't be captured, instead of leaving it stuck", async ({
      build,
      captureConfiguration,
      connection,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "story-a",
          },
        ],
      });

      await failed(
        { data: { buildId: build.id, snapshotId: snapshot!.id } },
        new Error("Timed out launching the browser"),
      );

      expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({ status: "error" });

      const logs = await dbClient.snapshotLogs.findBySnapshot(snapshot!.id);
      expect(logs).toContainEqual(
        expect.objectContaining({ level: "error", message: "Timed out launching the browser" }),
      );

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

    test("should create a diff immediately when a capture fails", async ({
      build,
      captureConfiguration,
    }) => {
      const [erroredSnapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "story-a",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "story-b",
          },
        ],
      });

      await failed(
        { data: { buildId: build.id, snapshotId: erroredSnapshot!.id } },
        new Error("capture failed"),
      );

      const diffs = await dbClient.diffs.findByBuild(build.id);
      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toMatchObject({
        snapshotId: erroredSnapshot!.id,
        processingStatus: "pending",
      });
    });
  });
});
