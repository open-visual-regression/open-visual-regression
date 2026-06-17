import { dbClient } from "@ovr/db/client";
import type { DiffJobPayload } from "@ovr/queue";
import { checkAllDoneAndFinalize, diffSnapshot } from "@ovr/services/snapshots";

type DiffJob = { data: DiffJobPayload };

export const run = async (job: DiffJob): Promise<void> => {
  await diffSnapshot(job.data.snapshotId, job.data.diffId);
};

export const failed = async (job: DiffJob): Promise<void> => {
  await dbClient.diffs.updateStatus(job.data.diffId, "error");

  const diff = await dbClient.diffs.findById(job.data.diffId);
  if (!diff) {
    return;
  }

  const snapshot = await dbClient.snapshots.findById(diff.snapshotId);
  if (snapshot) {
    await checkAllDoneAndFinalize(snapshot.buildId);
  }
};
