import "./env";

import { Worker, type Job } from "bullmq";
import { Redis } from "ioredis";

import { QueueName, schedulePurge } from "@ovr/queue";

import * as capture from "./handlers/capture";
import * as diff from "./handlers/diff";
import * as extract from "./handlers/extract";
import * as finalize from "./handlers/finalize";
import * as purge from "./handlers/purge";
import * as purgeDispatch from "./handlers/purgeDispatch";

const connection = new Redis(process.env.VALKEY_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const extractWorker = new Worker(QueueName.BUILD_EXTRACT, extract.run, { connection });
const captureWorker = new Worker(QueueName.SNAPSHOT_CAPTURE, capture.run, {
  connection,
  lockDuration: 3 * 60 * 1000,
});
const diffWorker = new Worker(QueueName.SNAPSHOT_DIFF, diff.run, { connection });
const finalizeWorker = new Worker(QueueName.BUILD_FINALIZE, finalize.run, { connection });
const purgeDispatchWorker = new Worker(QueueName.BUILD_PURGE_DISPATCH, purgeDispatch.run, {
  connection,
});
const purgeWorker = new Worker(QueueName.BUILD_PURGE, purge.run, { connection });

const isFinalAttempt = (job: Job<unknown>): boolean => job.attemptsMade >= (job.opts.attempts ?? 1);

const guard =
  <T>(fn: (job: { data: T }, error: Error) => Promise<void>) =>
  (job: Job<T> | undefined, error: Error) => {
    if (!job) {
      return;
    }
    console.error(`Job ${job.id} (${job.queueName}) failed on attempt ${job.attemptsMade}:`, error);
    if (!isFinalAttempt(job)) {
      return;
    }
    fn(job, error).catch((handlerError: unknown) => {
      console.error("Error while handling job failure:", handlerError);
    });
  };

extractWorker.on("failed", guard(extract.failed));
captureWorker.on("failed", guard(capture.failed));
diffWorker.on("failed", guard(diff.failed));
finalizeWorker.on("failed", guard(finalize.failed));
purgeDispatchWorker.on("failed", guard(purgeDispatch.failed));
purgeWorker.on("failed", guard(purge.failed));

const workers = [
  extractWorker,
  captureWorker,
  diffWorker,
  finalizeWorker,
  purgeDispatchWorker,
  purgeWorker,
];

try {
  await schedulePurge(connection);
} catch (error) {
  console.error("Failed to schedule the daily purge dispatch job:", error);
}

process.on("SIGTERM", async () => {
  await Promise.all(workers.map((worker) => worker.close()));
  process.exit(0);
});
