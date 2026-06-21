import type { Job } from "bullmq";
import { Redis } from "ioredis";

import {
  enqueueCapture as enqueueCaptureJob,
  enqueueDiff as enqueueDiffJob,
  enqueueExtract as enqueueExtractJob,
  enqueueFinalize as enqueueFinalizeJob,
  enqueuePurge as enqueuePurgeJob,
  type CaptureJobPayload,
  type DiffJobPayload,
  type ExtractJobPayload,
  type FinalizeJobPayload,
  type PurgeJobPayload,
} from "@ovr/queue";

const connection = new Redis(process.env.VALKEY_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const enqueueExtract = (payload: ExtractJobPayload): Promise<Job<ExtractJobPayload>> =>
  enqueueExtractJob(payload, connection);

export const enqueueCapture = (payload: CaptureJobPayload): Promise<Job<CaptureJobPayload>> =>
  enqueueCaptureJob(payload, connection);

export const enqueueDiff = (payload: DiffJobPayload): Promise<Job<DiffJobPayload>> =>
  enqueueDiffJob(payload, connection);

export const enqueueFinalize = (payload: FinalizeJobPayload): Promise<Job<FinalizeJobPayload>> =>
  enqueueFinalizeJob(payload, connection);

export const enqueuePurge = (payload: PurgeJobPayload): Promise<Job<PurgeJobPayload>> =>
  enqueuePurgeJob(payload, connection);
