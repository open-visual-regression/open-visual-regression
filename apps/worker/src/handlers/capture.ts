import { dbClient } from "@ovr/db/client";
import type { CaptureJobPayload } from "@ovr/queue";
import { captureSnapshot, enqueueDiffsIfAllCaptured } from "@ovr/services/snapshots";

type CaptureJob = { data: CaptureJobPayload };

export const capture = async (job: CaptureJob): Promise<void> => {
  await captureSnapshot(job.data.snapshotId);
};

export const captureFailed = async (job: CaptureJob): Promise<void> => {
  await dbClient.snapshots.updateStatus(job.data.snapshotId, "error");
  await enqueueDiffsIfAllCaptured(job.data.buildId);
};
