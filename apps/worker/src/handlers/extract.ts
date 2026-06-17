import type { Job } from "bullmq";

import { dbClient } from "@ovr/db/client";
import type { ExtractJobPayload } from "@ovr/queue";
import { extractBuild } from "@ovr/services/extract";

export const extractHandler = async (job: Job<ExtractJobPayload>): Promise<void> => {
  await extractBuild(job.data.buildId);
};

export const handleExtractFailed = async (job: Job<ExtractJobPayload>): Promise<void> => {
  await dbClient.builds.updateStatus(job.data.buildId, "error");
};
