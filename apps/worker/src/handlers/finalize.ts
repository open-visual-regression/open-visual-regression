import type { FinalizeJobPayload } from "@ovr/queue";
import { finalizeBuild } from "@ovr/services/builds";

type FinalizeJob = { data: FinalizeJobPayload };

export const finalize = async (job: FinalizeJob): Promise<void> => {
  await finalizeBuild(job.data.buildId);
};
