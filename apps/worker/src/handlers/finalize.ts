import { failBuild, finalizeBuild } from "@ovr/builds/builds";
import { dbClient } from "@ovr/db/client";
import type { FinalizeJobPayload } from "@ovr/queue";

type FinalizeJob = { data: FinalizeJobPayload };

export const run = async (job: FinalizeJob): Promise<void> => {
  // A snapshot rebuilt after this job was queued still has work left, and finishing it queues
  // another finalize, so this one would only settle the build too early.
  if (await dbClient.diffs.hasPendingForBuild(job.data.buildId)) {
    return;
  }

  await finalizeBuild(job.data.buildId);
};

export const failed = async (job: FinalizeJob, error?: Error): Promise<void> => {
  await failBuild(job.data.buildId, error?.message, "finalize_failed");
};
