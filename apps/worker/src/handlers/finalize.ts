import { dbClient } from "@ovr/db/client";
import type { FinalizeJobPayload } from "@ovr/queue";
import { finalizeBuild } from "@ovr/services/builds";

type FinalizeJob = { data: FinalizeJobPayload };

export const run = async (job: FinalizeJob): Promise<void> => {
  await finalizeBuild(job.data.buildId);
};

export const failed = async (job: FinalizeJob, error?: Error): Promise<void> => {
  await dbClient.builds.updateStatus(job.data.buildId, "error", error?.message);
};
