import type { PurgeDispatchJobPayload } from "@ovr/queue";
import { dispatchPurgeJobs } from "@ovr/services/retention";

type PurgeDispatchJob = { data: PurgeDispatchJobPayload };

export const run = async (_job: PurgeDispatchJob): Promise<void> => {
  await dispatchPurgeJobs();
};

export const failed = async (): Promise<void> => {};
