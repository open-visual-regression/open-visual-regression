import { extractBuild } from "@ovr/capture/extract";
import { dbClient } from "@ovr/db/client";
import type { ExtractJobPayload } from "@ovr/queue";

type ExtractJob = { data: ExtractJobPayload };

export const run = async (job: ExtractJob): Promise<void> => {
  const build = await dbClient.builds.updateProcessingStatus(job.data.buildId, "processing");

  if (!build) {
    return;
  }

  await extractBuild(
    job.data.buildId,
    job.data.targets,
    job.data.viewports,
    job.data.diffThreshold,
  );
};

export const failed = async (job: ExtractJob, error?: Error): Promise<void> => {
  await dbClient.builds.updateProcessingStatus(job.data.buildId, "error", error?.message);
};
