import { captureBuildGroup, enqueueSnapshotDiff } from "@ovr/capture/snapshots";
import { dbClient } from "@ovr/db/client";
import type { CaptureGroupJobPayload } from "@ovr/queue";

type CaptureGroupJob = { data: CaptureGroupJobPayload };

export const run = async (job: CaptureGroupJob): Promise<void> => {
  await captureBuildGroup(job.data.buildId, job.data.browser, job.data.snapshotIds);
};

export const failed = async (job: CaptureGroupJob, error: Error): Promise<void> => {
  for (const snapshotId of job.data.snapshotIds) {
    const snapshot = await dbClient.snapshots.findById(snapshotId);
    if (snapshot?.status === "success" || snapshot?.status === "canceled") {
      continue;
    }

    await dbClient.snapshotLogs.createMany({
      values: [{ snapshotId, level: "error", message: error.message }],
    });
    await dbClient.snapshots.updateStatus(snapshotId, "error");
    await enqueueSnapshotDiff(snapshotId);
  }
};
