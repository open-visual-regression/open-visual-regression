import { Worker } from "bullmq";
import { vi } from "vitest";

import {
  createBuildStatusSubscriber,
  publishBuildStatusEvent,
  type BuildStatusEvent,
} from "../events";
import {
  buildRedisConnection,
  enqueueDiff,
  queueOptions,
  QueueName,
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
