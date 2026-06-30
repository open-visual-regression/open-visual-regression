import type { PurgeDispatchJobPayload } from "@ovr/queue";
import { dispatchPurgeJobs } from "@ovr/builds/retention";

type PurgeDispatchJob = { data: PurgeDispatchJobPayload };

export const run = async (_job: PurgeDispatchJob): Promise<void> => {
  await dispatchPurgeJobs();
};

export const failed = async (_job: PurgeDispatchJob, error?: Error): Promise<void> => {
  console.error("Purge dispatch job failed:", error);
};
