import { dbClient } from "@ovr/db/client";
import { Worker } from "bullmq";
import { QueueName, type DiffJobPayload } from "@ovr/queue";

import { failed } from "../capture";
import { describe, expect, test } from "../../__tests__/fixtures";

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

      await failed({ data: { buildId: build.id, snapshotId: snapshot!.id } });

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

    test("should wait for every story in the build before moving toward a diff", async ({
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

      await failed({
        data: { buildId: build.id, snapshotId: erroredSnapshot!.id },
      });

      expect(await dbClient.diffs.findByBuild(build.id)).toEqual([]);
    });
  });
});
