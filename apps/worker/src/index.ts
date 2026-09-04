import "./env";
import { Worker, type Job } from "bullmq";
import { z } from "zod";

import { assertEncryptionKey } from "@ovr/git-status/crypto";
import { createLogger } from "@ovr/logger";
import { QueueName, buildRedisConnection, scheduleReaper, schedulePurge } from "@ovr/queue";

import * as capture from "./handlers/capture";
import * as diff from "./handlers/diff";
import * as extract from "./handlers/extract";
import * as finalize from "./handlers/finalize";
import * as projectPurge from "./handlers/projectPurge";
import * as publishStatus from "./handlers/publishStatus";
import * as purge from "./handlers/purge";
import * as purgeDispatch from "./handlers/purgeDispatch";
import * as reaper from "./handlers/reaper";

const logger = createLogger("worker");

assertEncryptionKey();

const connection = buildRedisConnection(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const CAPTURE_GROUP_CONCURRENCY = z.coerce
  .number()
  .int()
  .positive()
  .catch(2)
  .parse(process.env.OVR_CAPTURE_GROUP_CONCURRENCY);

const DIFF_CONCURRENCY = z.coerce
  .number()
  .int()
  .positive()
  .catch(4)
  .parse(process.env.OVR_DIFF_CONCURRENCY);

// Not a job-runtime cap — BullMQ renews this lock while the worker is alive.
const CAPTURE_LOCK_DURATION_MS = z.coerce
  .number()
  .int()
  .positive()
  .catch(120_000)
  .parse(process.env.OVR_CAPTURE_LOCK_DURATION_MS);

const shutdown = new AbortController();

const extractWorker = new Worker(QueueName.BUILD_EXTRACT, extract.run, { connection });
const captureWorker = new Worker(QueueName.SNAPSHOT_CAPTURE, capture.createRun(shutdown.signal), {
  connection,
  concurrency: CAPTURE_GROUP_CONCURRENCY,
  lockDuration: CAPTURE_LOCK_DURATION_MS,
});
const diffWorker = new Worker(QueueName.SNAPSHOT_DIFF, diff.run, {
  connection,
  concurrency: DIFF_CONCURRENCY,
});
const finalizeWorker = new Worker(QueueName.BUILD_FINALIZE, finalize.run, { connection });
const purgeDispatchWorker = new Worker(QueueName.BUILD_PURGE_DISPATCH, purgeDispatch.run, {
  connection,
});
const purgeWorker = new Worker(QueueName.BUILD_PURGE, purge.run, { connection });
const projectPurgeWorker = new Worker(QueueName.PROJECT_PURGE, projectPurge.run, { connection });
const reaperWorker = new Worker(QueueName.BUILD_REAPER, reaper.run, { connection });
const publishStatusWorker = new Worker(QueueName.GIT_STATUS_PUBLISH, publishStatus.run, {
  connection,
});

const isFinalAttempt = (job: Job<unknown>): boolean => job.attemptsMade >= (job.opts.attempts ?? 1);

const guard =
  <T>(fn: (job: { data: T }, error: Error) => Promise<void>) =>
  (job: Job<T> | undefined, error: Error) => {
    if (!job) {
      return;
    }
    logger.error(
      { err: error, jobId: job.id, queue: job.queueName, attempt: job.attemptsMade },
      "job failed",
    );
    if (!isFinalAttempt(job)) {
      return;
    }
    fn(job, error).catch((handlerError: unknown) => {
      logger.error({ err: handlerError }, "error while handling job failure");
    });
  };

extractWorker.on("failed", guard(extract.failed));
captureWorker.on("failed", guard(capture.failed));
diffWorker.on("failed", guard(diff.failed));
finalizeWorker.on("failed", guard(finalize.failed));
purgeDispatchWorker.on("failed", guard(purgeDispatch.failed));
purgeWorker.on("failed", guard(purge.failed));
projectPurgeWorker.on("failed", guard(projectPurge.failed));
reaperWorker.on("failed", guard(reaper.failed));
publishStatusWorker.on("failed", guard(publishStatus.failed));

const workers = [
  extractWorker,
  captureWorker,
  diffWorker,
  finalizeWorker,
  purgeDispatchWorker,
  purgeWorker,
  projectPurgeWorker,
  reaperWorker,
  publishStatusWorker,
];

try {
  await schedulePurge(connection);
} catch (error) {
  logger.error({ err: error }, "failed to schedule the daily purge dispatch job");
}

try {
  await scheduleReaper(connection);
} catch (error) {
  logger.error({ err: error }, "failed to schedule the build reaper job");
}

const onShutdown = async (): Promise<void> => {
  if (shutdown.signal.aborted) {
    return;
  }

  shutdown.abort();
  await Promise.all(workers.map((worker) => worker.close()));
  process.exit(0);
};

process.on("SIGTERM", onShutdown);
process.on("SIGINT", onShutdown);
