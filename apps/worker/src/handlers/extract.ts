import { dbClient } from "@ovr/db/client";
import type { ExtractJobPayload } from "@ovr/queue";
import { extractBuild } from "@ovr/services/extract";

type ExtractJob = { data: ExtractJobPayload };

export const run = async (job: ExtractJob): Promise<void> => {
  await extractBuild(job.data.buildId);
};

export const failed = async (job: ExtractJob): Promise<void> => {
  await dbClient.builds.updateStatus(job.data.buildId, "error");
};
