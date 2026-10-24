import type { Job, Worker } from "bullmq";

import { createCounter, createHistogram, DURATION_BUCKETS_SECONDS } from "@ovr/metrics";

import { isFinalAttempt } from "./attempts";

type JobOutcome = "completed" | "retried" | "failed";

const jobAttempts = createCounter<{ queue: string; outcome: JobOutcome }>("ovr.job.attempts", {
  description:
    "Job attempts that ended, by outcome. A failed attempt with retries left counts as retried.",
});

const jobDuration = createHistogram<{ queue: string; outcome: JobOutcome }>(
  "ovr.job.duration.seconds",
  {
    description: "How long a job attempt ran, from start to completion or failure.",
    unit: "s",
    buckets: DURATION_BUCKETS_SECONDS,
  },
);

const jobWait = createHistogram<{ queue: string }>("ovr.job.wait.seconds", {
  description: "How long a job waited in its queue before its first attempt started.",
  unit: "s",
  buckets: DURATION_BUCKETS_SECONDS,
});

const jobsStalled = createCounter<{ queue: string }>("ovr.jobs.stalled", {
  description: "Jobs whose worker stopped renewing their lock, so they will run again.",
});

const workerErrors = createCounter<{ queue: string }>("ovr.worker.errors", {
  description: "Errors a worker raised outside of a job, such as a lost Redis connection.",
});

const recordAttempt = (queue: string, job: Job, outcome: JobOutcome): void => {
  jobAttempts.add(1, { queue, outcome });
  if (job.processedOn) {
    jobDuration.record((Date.now() - job.processedOn) / 1000, { queue, outcome });
  }
};

export const observeJobs = (worker: Worker): void => {
  const queue = worker.name;

  // Later attempts would count earlier attempts and backoff as waiting.
  worker.on("active", (job) => {
    if (job.attemptsStarted === 1) {
      jobWait.record((Date.now() - job.timestamp - (job.opts.delay ?? 0)) / 1000, { queue });
    }
  });

  worker.on("completed", (job) => recordAttempt(queue, job, "completed"));

  worker.on("failed", (job) => {
    if (job) {
      recordAttempt(queue, job, isFinalAttempt(job) ? "failed" : "retried");
    }
  });

  worker.on("stalled", () => jobsStalled.add(1, { queue }));
  worker.on("error", () => workerErrors.add(1, { queue }));
};
