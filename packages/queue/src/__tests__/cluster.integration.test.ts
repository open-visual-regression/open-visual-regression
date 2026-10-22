import { Queue, Worker } from "bullmq";
import { vi } from "vitest";

import {
  createBuildStatusSubscriber,
  publishBuildStatusEvent,
  type BuildStatusEvent,
} from "../events";
import {
  buildRedisConnection,
  enqueueDiff,
  getQueueDepths,
  queueOptions,
  QueueName,
  tryAcquireLock,
  type DiffJobPayload,
} from "../index";
import { describe, expect, test } from "./fixtures";

describe("redis cluster", () => {
  test("should connect with a cluster client and a hash-tagged prefix", ({ clusterConnection }) => {
    expect(clusterConnection.isCluster).toBe(true);
    expect(queueOptions(clusterConnection).prefix).toBe("{bull}");
  });

  test("should keep the bull prefix in standalone mode", () => {
    const connection = buildRedisConnection("redis://localhost:6379", { lazyConnect: true });

    expect(connection.isCluster).toBe(false);
    expect(queueOptions(connection).prefix).toBe("bull");
  });

  test("should reject an unknown REDIS_MODE", () => {
    vi.stubEnv("REDIS_MODE", "sentinel");

    expect(() => buildRedisConnection("redis://localhost:6379")).toThrow(/REDIS_MODE/);
  });

  test("should count queued jobs and hold a lock in cluster mode", async ({
    clusterConnection,
  }) => {
    const queue = new Queue(QueueName.SNAPSHOT_DIFF, queueOptions(clusterConnection));
    try {
      const job = await queue.add("delayed", {}, { delay: 60_000 });
      const depths = await getQueueDepths(clusterConnection);
      await queue.remove(job.id!);

      expect(depths[QueueName.SNAPSHOT_DIFF]).toMatchObject({ delayed: 1 });
    } finally {
      await queue.close();
    }
    expect(await tryAcquireLock(clusterConnection, "cluster-test", 1000)).toBe(true);
    expect(await tryAcquireLock(clusterConnection, "cluster-test", 1000)).toBe(false);
    expect(await clusterConnection.exists("{bull}:lock:cluster-test")).toBe(1);
  });

  test("should deliver an enqueued job to a worker", async ({ clusterConnection }) => {
    const payload: DiffJobPayload = { snapshotId: "snapshot-1", diffId: "diff-cluster" };
    const worker = new Worker<DiffJobPayload>(
      QueueName.SNAPSHOT_DIFF,
      async (job) => job.data,
      queueOptions(clusterConnection),
    );

    try {
      const completed = new Promise<DiffJobPayload>((resolve, reject) => {
        worker.on("completed", (job) => resolve(job.data));
        worker.on("failed", (_job, error) => reject(error));
      });

      await enqueueDiff(payload, clusterConnection);

      expect(await completed).toEqual(payload);
    } finally {
      await worker.close();
    }
  });

  test("should deliver a published build status event to the subscriber", async ({
    clusterUrl,
    clusterConnection,
  }) => {
    const event: BuildStatusEvent = {
      buildId: "build-cluster",
      processingStatus: "success",
      reviewStatus: "approved",
      errorMessage: null,
    };
    const onEvent = vi.fn<(event: BuildStatusEvent) => void>();
    const subscriber = createBuildStatusSubscriber(onEvent, clusterUrl);

    try {
      await subscriber.ready;
      await publishBuildStatusEvent(event, clusterConnection);

      await vi.waitFor(() => expect(onEvent).toHaveBeenCalledWith(event));
    } finally {
      await subscriber.close();
    }
  });
});
