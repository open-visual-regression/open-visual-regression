import { Queue } from "bullmq";
import type { Job, JobsOptions } from "bullmq";
import type IORedis from "ioredis";

export enum QueueName {
  BUILD_EXTRACT = "build-extract",
  SNAPSHOT_CAPTURE = "snapshot-capture",
  SNAPSHOT_DIFF = "snapshot-diff",
  BUILD_FINALIZE = "build-finalize",
}

export type ExtractJobPayload = {
  buildId: string;
  artifactPath: string;
  targets: { id: string; title: string; name: string }[];
  viewports: {
    name?: string;
    browser: string;
    viewportWidth: number;
    viewportHeight?: number;
    default?: boolean;
  }[];
};

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

const JOB_OPTIONS: Record<QueueName, JobsOptions> = {
  [QueueName.BUILD_EXTRACT]: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
  [QueueName.SNAPSHOT_CAPTURE]: { attempts: 5, backoff: { type: "exponential", delay: 2000 } },
  [QueueName.SNAPSHOT_DIFF]: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
  [QueueName.BUILD_FINALIZE]: { attempts: 3, backoff: { type: "fixed", delay: 1000 } },
};

const enqueue = async <T>(
  queueName: QueueName,
  payload: T,
  connection: IORedis,
): Promise<Job<T>> => {
  const queue = new Queue<T, void, string, T, void, string>(queueName, { connection });
  try {
    return await queue.add(queueName, payload, JOB_OPTIONS[queueName]);
  } finally {
    await queue.close();
  }
};

export const enqueueExtract = (
  payload: ExtractJobPayload,
  connection: IORedis,
): Promise<Job<ExtractJobPayload>> => enqueue(QueueName.BUILD_EXTRACT, payload, connection);

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
