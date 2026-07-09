import { publishBuildStatus } from "@ovr/git-status/publishBuildStatus";
import type { GitStatusPublishJobPayload } from "@ovr/queue";

type PublishStatusJob = { data: GitStatusPublishJobPayload };

export const run = async (job: PublishStatusJob): Promise<void> => {
  await publishBuildStatus(job.data.buildId);
};

export const failed = async (job: PublishStatusJob, error?: Error): Promise<void> => {
  console.error(
    `Git status publish permanently failed for build ${job.data.buildId}:`,
    error?.message,
  );
};
