import { scanFlakySnapshots } from "@ovr/builds/flakiness";
import { createLogger } from "@ovr/logger";
import type { FlakySnapshotScanJobPayload } from "@ovr/queue";

const logger = createLogger("worker");

type FlakySnapshotScanJob = { data: FlakySnapshotScanJobPayload };

export const run = async (job: FlakySnapshotScanJob): Promise<void> => {
  await scanFlakySnapshots(job.data.projectId);
};

export const failed = async (job: FlakySnapshotScanJob, error?: Error): Promise<void> => {
  logger.error({ err: error, projectId: job.data.projectId }, "flaky snapshot scan job failed");
};
