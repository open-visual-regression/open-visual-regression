import { purgeExpiredBuilds } from "@ovr/builds/retention";
import { createLogger } from "@ovr/logger";
import type { PurgeJobPayload } from "@ovr/queue";

const logger = createLogger("worker");

type PurgeJob = { data: PurgeJobPayload };

export const run = async (job: PurgeJob): Promise<void> => {
  await purgeExpiredBuilds(job.data.projectId);
};

export const failed = async (job: PurgeJob, error?: Error): Promise<void> => {
  logger.error({ err: error, projectId: job.data.projectId }, "purge job failed");
};
