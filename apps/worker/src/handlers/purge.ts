import type { PurgeJobPayload } from "@ovr/queue";
import { purgeExpiredBuilds } from "@ovr/builds/retention";

type PurgeJob = { data: PurgeJobPayload };

export const run = async (job: PurgeJob): Promise<void> => {
  await purgeExpiredBuilds(job.data.projectId);
};

export const failed = async (job: PurgeJob, error?: Error): Promise<void> => {
  console.error(`Purge job failed for project ${job.data.projectId}:`, error);
};
