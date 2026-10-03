import { dispatchFlakySnapshotScans } from "@ovr/builds/flakiness";
import { createLogger } from "@ovr/logger";
import type { FlakySnapshotDispatchJobPayload } from "@ovr/queue";

const logger = createLogger("worker");

type FlakySnapshotDispatchJob = { data: FlakySnapshotDispatchJobPayload };

export const run = async (_job: FlakySnapshotDispatchJob): Promise<void> => {
  await dispatchFlakySnapshotScans();
};

export const failed = async (_job: FlakySnapshotDispatchJob, error?: Error): Promise<void> => {
  logger.error({ err: error }, "flaky snapshot dispatch job failed");
};
