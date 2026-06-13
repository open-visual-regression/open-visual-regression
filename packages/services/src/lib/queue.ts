import type { Job } from "bullmq";
import { Redis } from "ioredis";

import {
  enqueueCapture as enqueueCaptureJob,
  enqueueDiff as enqueueDiffJob,
  enqueueFinalize as enqueueFinalizeJob,
  type CaptureJobPayload,
  type DiffJobPayload,
  type FinalizeJobPayload,
} from "@ovr/queue";

const connection = new Redis(process.env.VALKEY_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const enqueueCapture = (payload: CaptureJobPayload): Promise<Job<CaptureJobPayload>> =>
  enqueueCaptureJob(payload, connection);

export const enqueueDiff = (payload: DiffJobPayload): Promise<Job<DiffJobPayload>> =>
  enqueueDiffJob(payload, connection);

export const enqueueFinalize = (payload: FinalizeJobPayload): Promise<Job<FinalizeJobPayload>> =>
  enqueueFinalizeJob(payload, connection);
