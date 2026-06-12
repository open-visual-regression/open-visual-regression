import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { afterAll, describe, expect, it } from "vitest";

import {
  enqueueCapture,
  enqueueDiff,
  enqueueFinalize,
  QueueName,
  type CaptureJobPayload,
  type DiffJobPayload,
  type FinalizeJobPayload,
} from "../index";

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
});

afterAll(async () => {
  await connection.quit();
});

const processedByWorker = async <T extends object>(
  queueName: QueueName,
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
  it("enqueueCapture delivers the payload to a capture worker and drains", async () => {
    const payload: CaptureJobPayload = { buildId: "build-1", snapshotId: "snapshot-1" };

    const data = await processedByWorker<CaptureJobPayload>(QueueName.SNAPSHOT_CAPTURE, () =>
      enqueueCapture(payload, connection),
    );

    expect(data).toEqual(payload);
  });

  it("enqueueDiff delivers the payload to a diff worker and drains", async () => {
    const payload: DiffJobPayload = { snapshotId: "snapshot-1", diffId: "diff-1" };

    const data = await processedByWorker<DiffJobPayload>(QueueName.SNAPSHOT_DIFF, () =>
      enqueueDiff(payload, connection),
    );

    expect(data).toEqual(payload);
  });

  it("enqueueFinalize delivers the payload to a finalize worker and drains", async () => {
    const payload: FinalizeJobPayload = { buildId: "build-1" };

    const data = await processedByWorker<FinalizeJobPayload>(QueueName.BUILD_FINALIZE, () =>
      enqueueFinalize(payload, connection),
    );

    expect(data).toEqual(payload);
  });
});
