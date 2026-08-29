import { publishBuildStatus } from "@ovr/git-status/publishBuildStatus";
import { createLogger } from "@ovr/logger";
import type { GitStatusPublishJobPayload } from "@ovr/queue";

const logger = createLogger("worker");

type PublishStatusJob = { data: GitStatusPublishJobPayload };

export const run = async (job: PublishStatusJob): Promise<void> => {
  await publishBuildStatus(job.data.buildId);
};

export const failed = async (job: PublishStatusJob, error?: Error): Promise<void> => {
  logger.error({ err: error, buildId: job.data.buildId }, "git status publish permanently failed");
};
