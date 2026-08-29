import { dispatchPurgeJobs } from "@ovr/builds/retention";
import { createLogger } from "@ovr/logger";
import type { PurgeDispatchJobPayload } from "@ovr/queue";

const logger = createLogger("worker");

type PurgeDispatchJob = { data: PurgeDispatchJobPayload };

export const run = async (_job: PurgeDispatchJob): Promise<void> => {
  await dispatchPurgeJobs();
};

export const failed = async (_job: PurgeDispatchJob, error?: Error): Promise<void> => {
  logger.error({ err: error }, "purge dispatch job failed");
};
