import { Queue } from "bullmq";
import type { Job } from "bullmq";
import type IORedis from "ioredis";

export enum QueueName {
  SNAPSHOT_CAPTURE = "snapshot:capture",
  SNAPSHOT_DIFF = "snapshot:diff",
  BUILD_FINALIZE = "build:finalize",
}

export type CaptureJobPayload = {
  buildId: string;
  snapshotId: string;
};

export type DiffJobPayload = {
  snapshotId: string;
  diffId: string;
};

export type FinalizeJobPayload = {
  buildId: string;
};

const enqueue = async <T>(
  queueName: QueueName,
  payload: T,
  connection: IORedis,
): Promise<Job<T>> => {
  const queue = new Queue(queueName, { connection });
  try {
    const job = await queue.add(queueName, payload);
    return job as unknown as Job<T>;
  } finally {
    await queue.close();
  }
};

export const enqueueCapture = (
  payload: CaptureJobPayload,
  connection: IORedis,
): Promise<Job<CaptureJobPayload>> => enqueue(QueueName.SNAPSHOT_CAPTURE, payload, connection);

export const enqueueDiff = (
  payload: DiffJobPayload,
  connection: IORedis,
): Promise<Job<DiffJobPayload>> => enqueue(QueueName.SNAPSHOT_DIFF, payload, connection);

export const enqueueFinalize = (
  payload: FinalizeJobPayload,
  connection: IORedis,
): Promise<Job<FinalizeJobPayload>> => enqueue(QueueName.BUILD_FINALIZE, payload, connection);
