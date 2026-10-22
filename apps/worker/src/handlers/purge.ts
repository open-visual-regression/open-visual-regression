import { z } from "zod";

import { DEFAULT_PURGE_OPTIONS, purgeExpiredBuilds } from "@ovr/builds/retention";
import { createLogger } from "@ovr/logger";
import type { PurgeJobPayload } from "@ovr/queue";

const logger = createLogger("worker");

const PURGE_OPTIONS = {
  batchSize: z.coerce
    .number()
    .int()
    .positive()
    .catch(DEFAULT_PURGE_OPTIONS.batchSize)
    .parse(process.env.OVR_PURGE_BATCH_SIZE),
  batchPauseMs: z.coerce
    .number()
    .int()
    .nonnegative()
    .catch(DEFAULT_PURGE_OPTIONS.batchPauseMs)
    .parse(process.env.OVR_PURGE_BATCH_PAUSE_MS),
  timeBudgetMs: z.coerce
    .number()
    .int()
    .positive()
    .catch(DEFAULT_PURGE_OPTIONS.timeBudgetMs)
    .parse(process.env.OVR_PURGE_TIME_BUDGET_MS),
};

type PurgeJob = { data: PurgeJobPayload };

export const run = async (job: PurgeJob): Promise<void> => {
  await purgeExpiredBuilds(job.data.projectId, PURGE_OPTIONS);
};

export const failed = async (job: PurgeJob, error?: Error): Promise<void> => {
  logger.error({ err: error, projectId: job.data.projectId }, "purge job failed");
};
