import type { Job } from "bullmq";

import {
  cancelBuildJobs as cancelBuildJobsJob,
  enqueueCaptureGroup as enqueueCaptureGroupJob,
  enqueueDiff as enqueueDiffJob,
  enqueueExtract as enqueueExtractJob,
  enqueueFinalize as enqueueFinalizeJob,
  enqueuePublishStatus as enqueuePublishStatusJob,
  enqueueProjectPurge as enqueueProjectPurgeJob,
  enqueuePurge as enqueuePurgeJob,
  enqueuePurgeMany as enqueuePurgeManyJob,
  type CanceledBuildJobs,
  type CaptureGroupJobPayload,
  type DiffJobPayload,
  type ExtractJobPayload,
  type FinalizeJobPayload,
  type GitStatusPublishJobPayload,
  type ProjectPurgeJobPayload,
  type PurgeJobPayload,
  buildRedisConnection,
} from "./index";

const connection = buildRedisConnection(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const enqueueExtract = (payload: ExtractJobPayload): Promise<Job<ExtractJobPayload>> =>
  enqueueExtractJob(payload, connection);

export const enqueueCaptureGroup = (
  payload: CaptureGroupJobPayload,
): Promise<Job<CaptureGroupJobPayload>> => enqueueCaptureGroupJob(payload, connection);

export const enqueueDiff = (payload: DiffJobPayload): Promise<Job<DiffJobPayload>> =>
  enqueueDiffJob(payload, connection);

export const enqueueFinalize = (payload: FinalizeJobPayload): Promise<Job<FinalizeJobPayload>> =>
  enqueueFinalizeJob(payload, connection);

export const enqueuePurge = (payload: PurgeJobPayload): Promise<Job<PurgeJobPayload>> =>
  enqueuePurgeJob(payload, connection);

export const enqueueProjectPurge = (
  payload: ProjectPurgeJobPayload,
): Promise<Job<ProjectPurgeJobPayload>> => enqueueProjectPurgeJob(payload, connection);

export const enqueuePublishStatus = (
  payload: GitStatusPublishJobPayload,
): Promise<Job<GitStatusPublishJobPayload>> => enqueuePublishStatusJob(payload, connection);

export const enqueuePurgeMany = (payloads: PurgeJobPayload[]): Promise<void> =>
  enqueuePurgeManyJob(payloads, connection);

export const cancelBuildJobs = (canceled: CanceledBuildJobs[]): Promise<void> =>
  cancelBuildJobsJob(canceled, connection);
