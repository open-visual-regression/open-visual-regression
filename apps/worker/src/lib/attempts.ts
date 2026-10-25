import type { Job } from "bullmq";

export const isFinalAttempt = (job: Job<unknown>): boolean =>
  job.attemptsMade >= (job.opts.attempts ?? 1);
