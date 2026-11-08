import { backfillSnapshotBaselines } from "@ovr/builds/backfills";
import { createLogger } from "@ovr/logger";
import type { SnapshotBaselineBackfillJobPayload } from "@ovr/queue";

const logger = createLogger("worker");

type SnapshotBaselineBackfillJob = { data: SnapshotBaselineBackfillJobPayload };

export const run = async (_job: SnapshotBaselineBackfillJob): Promise<void> => {
  await backfillSnapshotBaselines();
};

export const failed = async (_job: SnapshotBaselineBackfillJob, error?: Error): Promise<void> => {
  logger.error({ err: error }, "snapshot baseline backfill job failed");
};
