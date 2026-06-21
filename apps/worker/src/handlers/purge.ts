import type { PurgeJobPayload } from "@ovr/queue";
import { purgeExpiredBuilds } from "@ovr/services/retention";

type PurgeJob = { data: PurgeJobPayload };

export const run = async (job: PurgeJob): Promise<void> => {
  await purgeExpiredBuilds(job.data.projectId);
};

export const failed = async (): Promise<void> => {};
