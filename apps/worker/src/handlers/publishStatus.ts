import { publishBuildStatus } from "@ovr/git-status/publishBuildStatus";
import type { GitStatusPublishJobPayload } from "@ovr/queue";

type PublishStatusJob = { data: GitStatusPublishJobPayload };

export const run = async (job: PublishStatusJob): Promise<void> => {
  await publishBuildStatus(job.data.buildId);
};
