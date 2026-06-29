import { dbClient } from "@ovr/db/client";
import type { CaptureJobPayload } from "@ovr/queue";
import { captureSnapshot, enqueueSnapshotDiff } from "@ovr/services/snapshots";

type CaptureJob = { data: CaptureJobPayload };

export const run = async (job: CaptureJob): Promise<void> => {
  await captureSnapshot(job.data.snapshotId);
};

export const failed = async (job: CaptureJob, error: Error): Promise<void> => {
  await dbClient.snapshotLogs.createMany({
    values: [{ snapshotId: job.data.snapshotId, level: "error", message: error.message }],
  });
  await dbClient.snapshots.updateStatus(job.data.snapshotId, "error");
  await enqueueSnapshotDiff(job.data.snapshotId);
};
