import { finalizeBuild, publishStatus } from "@ovr/builds/builds";
import { dbClient } from "@ovr/db/client";
import type { FinalizeJobPayload } from "@ovr/queue";

type FinalizeJob = { data: FinalizeJobPayload };

export const run = async (job: FinalizeJob): Promise<void> => {
  await finalizeBuild(job.data.buildId);
};

export const failed = async (job: FinalizeJob, error?: Error): Promise<void> => {
  await dbClient.builds.updateProcessingStatus(job.data.buildId, "error", error?.message);
  await publishStatus(job.data.buildId);
};
