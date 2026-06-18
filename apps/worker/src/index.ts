import { Worker, type Job } from "bullmq";
import { Redis } from "ioredis";

import { QueueName } from "@ovr/queue";

import * as capture from "./handlers/capture";
import * as diff from "./handlers/diff";
import * as extract from "./handlers/extract";
import * as finalize from "./handlers/finalize";

const connection = new Redis(process.env.VALKEY_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const extractWorker = new Worker(QueueName.BUILD_EXTRACT, extract.run, { connection });
const captureWorker = new Worker(QueueName.SNAPSHOT_CAPTURE, capture.run, { connection });
const diffWorker = new Worker(QueueName.SNAPSHOT_DIFF, diff.run, { connection });
const finalizeWorker = new Worker(QueueName.BUILD_FINALIZE, finalize.run, { connection });

// BullMQ emits "failed" after every attempt, including ones that still have
// retries left, so only treat the job as permanently failed once it has used
// up every attempt.
const isFinalAttempt = (job: Job): boolean => job.attemptsMade >= (job.opts.attempts ?? 1);

const guard =
  <T extends { data: unknown }>(fn: (job: T) => Promise<void>) =>
  (job: Job | undefined) => {
    if (!job || !isFinalAttempt(job)) {
      return;
    }
    fn(job as unknown as T).catch((error: unknown) => {
      console.error("Error while handling job failure:", error);
    });
  };

extractWorker.on("failed", guard(extract.failed));
captureWorker.on("failed", guard(capture.failed));
diffWorker.on("failed", guard(diff.failed));
finalizeWorker.on("failed", guard(finalize.failed));

const workers = [extractWorker, captureWorker, diffWorker, finalizeWorker];

process.on("SIGTERM", async () => {
  await Promise.all(workers.map((worker) => worker.close()));
  process.exit(0);
});
