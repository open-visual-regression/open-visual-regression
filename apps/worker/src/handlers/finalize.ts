import type { Job } from "bullmq";

import type { FinalizeJobPayload } from "@ovr/queue";
import { finalizeBuild } from "@ovr/services/builds";

export const finalizeHandler = async (job: Job<FinalizeJobPayload>): Promise<void> => {
  await finalizeBuild(job.data.buildId);
};
