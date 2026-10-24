import { failBuild, finalizeBuild } from "@ovr/builds/builds";
import type { FinalizeJobPayload } from "@ovr/queue";

type FinalizeJob = { data: FinalizeJobPayload };

export const run = async (job: FinalizeJob): Promise<void> => {
  await finalizeBuild(job.data.buildId);
};

export const failed = async (job: FinalizeJob, error?: Error): Promise<void> => {
  await failBuild(job.data.buildId, error?.message, "finalize_failed");
};
