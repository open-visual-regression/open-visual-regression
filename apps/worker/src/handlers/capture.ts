import type { Job } from "bullmq";

import { dbClient } from "@ovr/db/client";
import type { CaptureJobPayload } from "@ovr/queue";
import { captureSnapshot, enqueueDiffsIfAllCaptured } from "@ovr/services/snapshots";

export const captureHandler = async (job: Job<CaptureJobPayload>): Promise<void> => {
  await captureSnapshot(job.data.snapshotId);
};

export const handleCaptureFailed = async (job: Job<CaptureJobPayload>): Promise<void> => {
  await dbClient.snapshots.updateStatus(job.data.snapshotId, "error");
  await enqueueDiffsIfAllCaptured(job.data.buildId);
};
