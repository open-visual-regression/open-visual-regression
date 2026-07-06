import type { Job } from "bullmq";
import { Redis } from "ioredis";

import {
  cancelBuildJobs as cancelBuildJobsJob,
  enqueueCaptureGroup as enqueueCaptureGroupJob,
  enqueueDiff as enqueueDiffJob,
  enqueueExtract as enqueueExtractJob,
  enqueueFinalize as enqueueFinalizeJob,
  enqueuePurge as enqueuePurgeJob,
  enqueuePurgeMany as enqueuePurgeManyJob,
  type CaptureGroupJobPayload,
  type DiffJobPayload,
  type ExtractJobPayload,
  type FinalizeJobPayload,
  type PurgeJobPayload,
} from "./index";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
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

export const enqueuePurgeMany = (payloads: PurgeJobPayload[]): Promise<void> =>
  enqueuePurgeManyJob(payloads, connection);

export const cancelBuildJobs = (buildId: string, diffIds: string[]): Promise<void> =>
  cancelBuildJobsJob(buildId, diffIds, connection);
