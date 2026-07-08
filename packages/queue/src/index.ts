import { Queue } from "bullmq";
import type { Job, JobsOptions } from "bullmq";
import type IORedis from "ioredis";

import { createLogger } from "@ovr/logger";

const logger = createLogger("queue");

export enum QueueName {
  BUILD_EXTRACT = "build-extract",
  SNAPSHOT_CAPTURE = "snapshot-capture",
  SNAPSHOT_DIFF = "snapshot-diff",
  BUILD_FINALIZE = "build-finalize",
  BUILD_PURGE_DISPATCH = "build-purge-dispatch",
  BUILD_PURGE = "build-purge",
  BUILD_REAPER = "build-reaper",
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
  diffThreshold: number;
};

export type CaptureGroupJobPayload = {
  buildId: string;
  browser: string;
  snapshotIds: string[];
};

export type DiffJobPayload = {
  snapshotId: string;
  diffId: string;
};

export type FinalizeJobPayload = {
  buildId: string;
};

export type PurgeDispatchJobPayload = Record<string, never>;

export type PurgeJobPayload = {
  projectId: string;
};

export type ReaperJobPayload = Record<string, never>;

const JOB_OPTIONS: Record<QueueName, JobsOptions> = {
  [QueueName.BUILD_EXTRACT]: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
  [QueueName.SNAPSHOT_CAPTURE]: { attempts: 5, backoff: { type: "exponential", delay: 2000 } },
  [QueueName.SNAPSHOT_DIFF]: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
  [QueueName.BUILD_FINALIZE]: { attempts: 3, backoff: { type: "fixed", delay: 1000 } },
  [QueueName.BUILD_PURGE_DISPATCH]: { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  [QueueName.BUILD_PURGE]: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
  [QueueName.BUILD_REAPER]: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
};

const enqueue = async <T>(
  queueName: QueueName,
  payload: T,
  connection: IORedis,
  extraOpts?: JobsOptions,
): Promise<Job<T>> => {
  const queue = new Queue<T, void, string, T, void, string>(queueName, { connection });
  try {
    return await queue.add(queueName, payload, { ...JOB_OPTIONS[queueName], ...extraOpts });
  } finally {
    await queue.close();
  }
};

export const enqueueExtract = (
  payload: ExtractJobPayload,
  connection: IORedis,
): Promise<Job<ExtractJobPayload>> =>
  enqueue(QueueName.BUILD_EXTRACT, payload, connection, { jobId: payload.buildId });

export const enqueueCaptureGroup = (
  payload: CaptureGroupJobPayload,
  connection: IORedis,
): Promise<Job<CaptureGroupJobPayload>> => enqueue(QueueName.SNAPSHOT_CAPTURE, payload, connection);

export const enqueueDiff = (
  payload: DiffJobPayload,
  connection: IORedis,
): Promise<Job<DiffJobPayload>> =>
  enqueue(QueueName.SNAPSHOT_DIFF, payload, connection, { jobId: payload.diffId });

export const enqueueFinalize = (
  payload: FinalizeJobPayload,
  connection: IORedis,
): Promise<Job<FinalizeJobPayload>> =>
  enqueue(QueueName.BUILD_FINALIZE, payload, connection, { jobId: payload.buildId });

export const enqueuePurge = (
  payload: PurgeJobPayload,
  connection: IORedis,
): Promise<Job<PurgeJobPayload>> => enqueue(QueueName.BUILD_PURGE, payload, connection);

export const enqueuePurgeMany = async (
  payloads: PurgeJobPayload[],
  connection: IORedis,
): Promise<void> => {
  if (payloads.length === 0) {
    return;
  }

  const queue = new Queue<PurgeJobPayload, void, string, PurgeJobPayload, void, string>(
    QueueName.BUILD_PURGE,
    { connection },
  );
  try {
    await queue.addBulk(
      payloads.map((payload) => ({
        name: QueueName.BUILD_PURGE,
        data: payload,
        opts: JOB_OPTIONS[QueueName.BUILD_PURGE],
      })),
    );
  } finally {
    await queue.close();
  }
};

const removeJob = async (job: Pick<Job, "id" | "remove">, queueName: string): Promise<void> => {
  try {
    await job.remove();
  } catch (err) {
    logger.debug({ err, jobId: job.id, queue: queueName }, "skipped removing in-flight job");
  }
};

const removeJobById = async (queue: Queue, jobId: string): Promise<void> => {
  const job = await queue.getJob(jobId);
  if (job) {
    await removeJob(job, queue.name);
  }
};

export const cancelBuildJobs = async (
  buildId: string,
  diffIds: string[],
  connection: IORedis,
): Promise<void> => {
  const extractQueue = new Queue(QueueName.BUILD_EXTRACT, { connection });
  const captureQueue = new Queue(QueueName.SNAPSHOT_CAPTURE, { connection });
  const diffQueue = new Queue(QueueName.SNAPSHOT_DIFF, { connection });
  const finalizeQueue = new Queue(QueueName.BUILD_FINALIZE, { connection });

  try {
    await Promise.all([
      removeJobById(extractQueue, buildId),
      removeJobById(finalizeQueue, buildId),
      ...diffIds.map((diffId) => removeJobById(diffQueue, diffId)),
      captureQueue
        .getJobs(["waiting", "delayed", "prioritized", "paused"])
        .then((captureJobs) =>
          Promise.all(
            captureJobs
              .filter((job) => (job.data as CaptureGroupJobPayload).buildId === buildId)
              .map((job) => removeJob(job, captureQueue.name)),
          ),
        ),
    ]);
  } finally {
    await Promise.all([
      extractQueue.close(),
      captureQueue.close(),
      diffQueue.close(),
      finalizeQueue.close(),
    ]);
  }
};

const PURGE_DISPATCH_JOB_ID = "build-purge-dispatch";

export const schedulePurge = async (connection: IORedis): Promise<void> => {
  const queue = new Queue<PurgeDispatchJobPayload>(QueueName.BUILD_PURGE_DISPATCH, { connection });
  try {
    await queue.upsertJobScheduler(
      PURGE_DISPATCH_JOB_ID,
      { pattern: "0 3 * * *" },
      { name: QueueName.BUILD_PURGE_DISPATCH, data: {} },
    );
  } finally {
    await queue.close();
  }
};

const REAPER_JOB_ID = "build-reaper";

export const scheduleReaper = async (connection: IORedis): Promise<void> => {
  const queue = new Queue<ReaperJobPayload>(QueueName.BUILD_REAPER, { connection });
  try {
    await queue.upsertJobScheduler(
      REAPER_JOB_ID,
      { pattern: "*/5 * * * *" },
      { name: QueueName.BUILD_REAPER, data: {} },
    );
  } finally {
    await queue.close();
  }
};
