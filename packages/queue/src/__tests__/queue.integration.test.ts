import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import {
  enqueueCaptureGroup,
  enqueueDiff,
  enqueueExtract,
  enqueueFinalize,
  enqueueFlakySnapshotDispatch,
  enqueueFlakySnapshotScanMany,
  getJobNextRunAt,
  isJobRunning,
  enqueuePublishStatus,
  QueueName,
  scheduleJob,
  scheduleReaper,
  type CaptureGroupJobPayload,
  type DiffJobPayload,
  type ExtractJobPayload,
  type FinalizeJobPayload,
} from "../index";
import { describe, expect, test } from "./fixtures";

const processedByWorker = async <T extends object>(
  queueName: QueueName,
  connection: Redis,
  enqueue: () => Promise<unknown>,
): Promise<T> => {
  const worker = new Worker<T>(queueName, async (job) => job.data, { connection });

  try {
    const completed = new Promise<T>((resolve, reject) => {
      worker.on("completed", (job) => resolve(job.data));
      worker.on("failed", (_job, error) => reject(error));
    });

    await enqueue();
    const data = await completed;

    const queue = new Queue(queueName, { connection });
    try {
      const counts = await queue.getJobCounts("wait", "active", "delayed");
      const pending = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);
      expect(pending).toBe(0);
    } finally {
      await queue.close();
    }

    return data;
  } finally {
    await worker.close();
  }
};

describe("queue", () => {
  describe("enqueueExtract", () => {
    test("should deliver the payload to an extract worker and drain the queue", async ({
      connection,
    }) => {
      const payload: ExtractJobPayload = {
        buildId: "build-1",
        artifactPath: "builds/build-1/artifact.tar.gz",
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: [{ browser: "chromium", viewportWidth: 1280 }],
        diffThreshold: 0.05,
      };

      const data = await processedByWorker<ExtractJobPayload>(
        QueueName.BUILD_EXTRACT,
        connection,
        () => enqueueExtract(payload, connection),
      );

      expect(data).toEqual(payload);
    });
  });

  describe("enqueueCaptureGroup", () => {
    test("should deliver the payload to a capture worker and drain the queue", async ({
      connection,
    }) => {
      const payload: CaptureGroupJobPayload = {
        buildId: "build-1",
        browser: "chromium",
        snapshotIds: ["snapshot-1", "snapshot-2"],
      };

      const data = await processedByWorker<CaptureGroupJobPayload>(
        QueueName.SNAPSHOT_CAPTURE,
        connection,
        () => enqueueCaptureGroup(payload, connection),
      );

      expect(data).toEqual(payload);
    });
  });

  describe("enqueueDiff", () => {
    test("should deliver the payload to a diff worker and drain the queue", async ({
      connection,
    }) => {
      const payload: DiffJobPayload = { snapshotId: "snapshot-1", diffId: "diff-1" };

      const data = await processedByWorker<DiffJobPayload>(
        QueueName.SNAPSHOT_DIFF,
        connection,
        () => enqueueDiff(payload, connection),
      );

      expect(data).toEqual(payload);
    });
  });

  describe("enqueueFinalize", () => {
    test("should deliver the payload to a finalize worker and drain the queue", async ({
      connection,
    }) => {
      const payload: FinalizeJobPayload = { buildId: "build-1" };

      const data = await processedByWorker<FinalizeJobPayload>(
        QueueName.BUILD_FINALIZE,
        connection,
        () => enqueueFinalize(payload, connection),
      );

      expect(data).toEqual(payload);
    });
  });

  describe("enqueueFinalize again for the same build", () => {
    test("should finalize the build again after its earlier finalize completed", async ({
      connection,
    }) => {
      const payload: FinalizeJobPayload = { buildId: "build-refinalize" };

      await processedByWorker<FinalizeJobPayload>(QueueName.BUILD_FINALIZE, connection, () =>
        enqueueFinalize(payload, connection),
      );

      const data = await processedByWorker<FinalizeJobPayload>(
        QueueName.BUILD_FINALIZE,
        connection,
        () => enqueueFinalize(payload, connection),
      );

      expect(data).toEqual(payload);
    });

    test("should remove the job on final failure so a later finalize for the same build isn't dropped", async ({
      connection,
    }) => {
      const job = await enqueueFinalize({ buildId: "build-refinalize-failed" }, connection);
      try {
        expect(job.opts.removeOnFail).toBe(true);
      } finally {
        await job.remove();
      }
    });
  });

  describe("job retention", () => {
    test("should bound how many finished diff jobs are kept", async ({ connection, trackJob }) => {
      const job = trackJob(
        await enqueueDiff(
          { snapshotId: "snapshot-retention", diffId: "diff-retention" },
          connection,
        ),
      );

      expect(job.opts.removeOnComplete).toEqual({ age: 60 * 60, count: 1000 });
      expect(job.opts.removeOnFail).toEqual({ age: 7 * 24 * 60 * 60, count: 1000 });
    });

    test("should bound how many finished reaper runs are kept", async ({
      connection,
      openQueue,
    }) => {
      await scheduleReaper(connection);

      const [scheduler] = await openQueue(QueueName.BUILD_REAPER).getJobSchedulers();

      expect(scheduler?.template?.opts?.removeOnComplete).toEqual({ age: 60 * 60, count: 1000 });
    });
  });

  describe("enqueuePublishStatus", () => {
    test("should remove the job on final failure so a later publish for the same build isn't dropped", async ({
      connection,
    }) => {
      const job = await enqueuePublishStatus({ buildId: "build-removeonfail" }, connection);
      try {
        expect(job.opts.removeOnFail).toBe(true);
      } finally {
        await job.remove();
      }
    });
  });

  describe("enqueueFlakySnapshotScanMany", () => {
    test("should queue one scan per project even when a project is dispatched again before its scan runs", async ({
      connection,
      openQueue,
    }) => {
      const queue = openQueue(QueueName.FLAKY_SNAPSHOT_SCAN);

      await enqueueFlakySnapshotScanMany(
        [{ projectId: "project-a" }, { projectId: "project-b" }],
        connection,
      );
      await enqueueFlakySnapshotScanMany([{ projectId: "project-a" }], connection);

      try {
        const waiting = await queue.getWaiting();
        expect(waiting.map((job) => job.data.projectId).sort()).toEqual(["project-a", "project-b"]);
      } finally {
        await queue.obliterate({ force: true });
      }
    });
  });

  describe("scheduleJob", () => {
    test("should run the flaky detection dispatch on the given cron pattern", async ({
      connection,
      openQueue,
    }) => {
      await scheduleJob(connection, "flaky_detection", "0 */6 * * *");

      const [scheduler] = await openQueue(QueueName.FLAKY_SNAPSHOT_DISPATCH).getJobSchedulers();

      expect(scheduler?.pattern).toBe("0 */6 * * *");
    });

    test("should stop running the flaky detection dispatch once no cron pattern is given", async ({
      connection,
      openQueue,
    }) => {
      await scheduleJob(connection, "flaky_detection", "0 */6 * * *");
      await scheduleJob(connection, "flaky_detection", null);

      expect(await openQueue(QueueName.FLAKY_SNAPSHOT_DISPATCH).getJobSchedulers()).toEqual([]);
    });
  });

  describe("getJobNextRunAt", () => {
    test("should report when the flaky detection dispatch is next scheduled to run", async ({
      connection,
      openQueue,
    }) => {
      await scheduleJob(connection, "flaky_detection", "0 */6 * * *");

      try {
        const [scheduler] = await openQueue(QueueName.FLAKY_SNAPSHOT_DISPATCH).getJobSchedulers();

        expect(await getJobNextRunAt(connection, "flaky_detection")).toEqual(
          new Date(scheduler!.next!),
        );
      } finally {
        await openQueue(QueueName.FLAKY_SNAPSHOT_DISPATCH).obliterate({ force: true });
      }
    });

    test("should keep the next scheduled run when a dispatch is run now", async ({
      connection,
      openQueue,
    }) => {
      await scheduleJob(connection, "flaky_detection", "0 */6 * * *");

      try {
        const nextRunAt = await getJobNextRunAt(connection, "flaky_detection");
        await enqueueFlakySnapshotDispatch(connection);

        expect(await getJobNextRunAt(connection, "flaky_detection")).toEqual(nextRunAt);
      } finally {
        await openQueue(QueueName.FLAKY_SNAPSHOT_DISPATCH).obliterate({ force: true });
      }
    });

    test("should report no next run when flaky detection is not scheduled", async ({
      connection,
    }) => {
      expect(await getJobNextRunAt(connection, "flaky_detection")).toBeNull();
    });
  });

  describe("isJobRunning", () => {
    test("should not count flaky detection as running when nothing is queued", async ({
      connection,
    }) => {
      expect(await isJobRunning(connection, "flaky_detection")).toBe(false);
    });

    test("should not count the scheduler's next run as running", async ({
      connection,
      openQueue,
    }) => {
      await scheduleJob(connection, "flaky_detection", "0 */6 * * *");

      try {
        expect(await isJobRunning(connection, "flaky_detection")).toBe(false);
      } finally {
        await openQueue(QueueName.FLAKY_SNAPSHOT_DISPATCH).obliterate({ force: true });
      }
    });

    test("should count flaky detection as running while a dispatch is queued", async ({
      connection,
      openQueue,
    }) => {
      await enqueueFlakySnapshotDispatch(connection);

      try {
        expect(await isJobRunning(connection, "flaky_detection")).toBe(true);
      } finally {
        await openQueue(QueueName.FLAKY_SNAPSHOT_DISPATCH).obliterate({ force: true });
      }
    });

    test("should count flaky detection as running while project scans are queued", async ({
      connection,
      openQueue,
    }) => {
      await enqueueFlakySnapshotScanMany([{ projectId: "project-a" }], connection);

      try {
        expect(await isJobRunning(connection, "flaky_detection")).toBe(true);
      } finally {
        await openQueue(QueueName.FLAKY_SNAPSHOT_SCAN).obliterate({ force: true });
      }
    });
  });
});
