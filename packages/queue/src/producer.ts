import type { Job } from "bullmq";

import type { JobName } from "@ovr/db/schema";

import {
  publishBuildStatusEvent as publishBuildStatusEventCmd,
  type BuildStatusEvent,
} from "./events";
import {
  cancelBuildJobs as cancelBuildJobsJob,
  enqueueCaptureGroup as enqueueCaptureGroupJob,
  enqueueDiff as enqueueDiffJob,
  enqueueExtract as enqueueExtractJob,
  enqueueFinalize as enqueueFinalizeJob,
  enqueueFlakySnapshotScanMany as enqueueFlakySnapshotScanManyJob,
  enqueuePublishStatus as enqueuePublishStatusJob,
  enqueueProjectPurge as enqueueProjectPurgeJob,
  enqueuePurge as enqueuePurgeJob,
  enqueuePurgeMany as enqueuePurgeManyJob,
  scheduleJob as scheduleJobCmd,
  type CanceledBuildJobs,
  type CaptureGroupJobPayload,
  type DiffJobPayload,
  type ExtractJobPayload,
  type FinalizeJobPayload,
  type FlakySnapshotScanJobPayload,
  type GitStatusPublishJobPayload,
  type ProjectPurgeJobPayload,
  type PurgeJobPayload,
  buildRedisConnection,
  waitForConnection,
} from "./index";

const QUEUE_TIMEOUT_MS = 5_000;

const connection = buildRedisConnection(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  commandTimeout: QUEUE_TIMEOUT_MS,
});

const whenConnected = async <T>(send: () => Promise<T>): Promise<T> => {
  await waitForConnection(connection, QUEUE_TIMEOUT_MS);
  return send();
};

export const enqueueExtract = (payload: ExtractJobPayload): Promise<Job<ExtractJobPayload>> =>
  whenConnected(() => enqueueExtractJob(payload, connection));

export const enqueueCaptureGroup = (
  payload: CaptureGroupJobPayload,
): Promise<Job<CaptureGroupJobPayload>> =>
  whenConnected(() => enqueueCaptureGroupJob(payload, connection));

export const enqueueDiff = (payload: DiffJobPayload): Promise<Job<DiffJobPayload>> =>
  whenConnected(() => enqueueDiffJob(payload, connection));

export const enqueueFinalize = (payload: FinalizeJobPayload): Promise<Job<FinalizeJobPayload>> =>
  whenConnected(() => enqueueFinalizeJob(payload, connection));

export const enqueuePurge = (payload: PurgeJobPayload): Promise<Job<PurgeJobPayload>> =>
  whenConnected(() => enqueuePurgeJob(payload, connection));

export const enqueueProjectPurge = (
  payload: ProjectPurgeJobPayload,
): Promise<Job<ProjectPurgeJobPayload>> =>
  whenConnected(() => enqueueProjectPurgeJob(payload, connection));

export const enqueuePublishStatus = (
  payload: GitStatusPublishJobPayload,
): Promise<Job<GitStatusPublishJobPayload>> =>
  whenConnected(() => enqueuePublishStatusJob(payload, connection));

export const publishBuildStatusEvent = (event: BuildStatusEvent): Promise<void> =>
  whenConnected(() => publishBuildStatusEventCmd(event, connection));

export const enqueuePurgeMany = (payloads: PurgeJobPayload[]): Promise<void> =>
  whenConnected(() => enqueuePurgeManyJob(payloads, connection));

export const enqueueFlakySnapshotScanMany = (
  payloads: FlakySnapshotScanJobPayload[],
): Promise<void> => whenConnected(() => enqueueFlakySnapshotScanManyJob(payloads, connection));

export const cancelBuildJobs = (canceled: CanceledBuildJobs[]): Promise<void> =>
  whenConnected(() => cancelBuildJobsJob(canceled, connection));

export const scheduleJob = (job: JobName, pattern: string | null): Promise<void> =>
  whenConnected(() => scheduleJobCmd(connection, job, pattern));
