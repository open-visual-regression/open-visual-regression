import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import {
  enqueueCaptureGroup,
  enqueueDiff,
  enqueueExtract,
  enqueueFinalize,
  enqueuePublishStatus,
  QueueName,
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
    test("should bound how many finished diff jobs are kept", async ({ connection }) => {
      const job = await enqueueDiff(
        { snapshotId: "snapshot-retention", diffId: "diff-retention" },
        connection,
      );
      try {
        expect(job.opts.removeOnComplete).toEqual({ age: 60 * 60, count: 1000 });
        expect(job.opts.removeOnFail).toEqual({ age: 7 * 24 * 60 * 60, count: 1000 });
      } finally {
        await job.remove();
      }
    });

    test("should bound how many finished reaper runs are kept", async ({ connection }) => {
      await scheduleReaper(connection);

      const queue = new Queue(QueueName.BUILD_REAPER, { connection });
      try {
        const [scheduler] = await queue.getJobSchedulers();
        expect(scheduler?.template?.opts?.removeOnComplete).toEqual({ age: 60 * 60, count: 1000 });
      } finally {
        await queue.close();
      }
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
});
