import "./env";
import { Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import { z } from "zod";

import { CAPTURE_GROUP_SIZE } from "@ovr/capture/extract";
import { CAPTURE_JOB_TIMEOUT_MS } from "@ovr/capture/lib/captureTimeouts";
import { QueueName, scheduleReaper, schedulePurge } from "@ovr/queue";

import * as capture from "./handlers/capture";
import * as diff from "./handlers/diff";
import * as extract from "./handlers/extract";
import * as finalize from "./handlers/finalize";
import * as purge from "./handlers/purge";
import * as purgeDispatch from "./handlers/purgeDispatch";
import * as reaper from "./handlers/reaper";

const connection = new Redis(process.env.VALKEY_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const CAPTURE_GROUP_CONCURRENCY = z.coerce
  .number()
  .int()
  .positive()
  .catch(2)
  .parse(process.env.OVR_CAPTURE_GROUP_CONCURRENCY);

const extractWorker = new Worker(QueueName.BUILD_EXTRACT, extract.run, { connection });
const captureWorker = new Worker(QueueName.SNAPSHOT_CAPTURE, capture.run, {
  connection,
  concurrency: CAPTURE_GROUP_CONCURRENCY,
  // A group job budgets CAPTURE_JOB_TIMEOUT_MS per snapshot; the lock must outlive that.
  lockDuration: CAPTURE_JOB_TIMEOUT_MS * CAPTURE_GROUP_SIZE,
});
const diffWorker = new Worker(QueueName.SNAPSHOT_DIFF, diff.run, { connection });
const finalizeWorker = new Worker(QueueName.BUILD_FINALIZE, finalize.run, { connection });
const purgeDispatchWorker = new Worker(QueueName.BUILD_PURGE_DISPATCH, purgeDispatch.run, {
  connection,
});
const purgeWorker = new Worker(QueueName.BUILD_PURGE, purge.run, { connection });
const reaperWorker = new Worker(QueueName.BUILD_REAPER, reaper.run, { connection });

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
reaperWorker.on("failed", guard(reaper.failed));

const workers = [
  extractWorker,
  captureWorker,
  diffWorker,
  finalizeWorker,
  purgeDispatchWorker,
  purgeWorker,
  reaperWorker,
];

try {
  await schedulePurge(connection);
} catch (error) {
  console.error("Failed to schedule the daily purge dispatch job:", error);
}

try {
  await scheduleReaper(connection);
} catch (error) {
  console.error("Failed to schedule the build reaper job:", error);
}

process.on("SIGTERM", async () => {
  await Promise.all(workers.map((worker) => worker.close()));
  process.exit(0);
});
