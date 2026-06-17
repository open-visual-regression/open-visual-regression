import { Worker } from "bullmq";
import { Redis } from "ioredis";

import { QueueName } from "@ovr/queue";

import { captureHandler, handleCaptureFailed } from "./handlers/capture";
import { diffHandler, handleDiffFailed } from "./handlers/diff";
import { extractHandler, handleExtractFailed } from "./handlers/extract";
import { finalizeHandler } from "./handlers/finalize";

const connection = new Redis(process.env.VALKEY_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const extractWorker = new Worker(QueueName.BUILD_EXTRACT, extractHandler, { connection });
const captureWorker = new Worker(QueueName.SNAPSHOT_CAPTURE, captureHandler, { connection });
const diffWorker = new Worker(QueueName.SNAPSHOT_DIFF, diffHandler, { connection });
const finalizeWorker = new Worker(QueueName.BUILD_FINALIZE, finalizeHandler, { connection });

const guard =
  <T>(handler: (job: T) => Promise<void>) =>
  (job: T | undefined) => {
    if (!job) {
      return;
    }
    handler(job).catch((error: unknown) => {
      console.error("Error while handling job failure:", error);
    });
  };

extractWorker.on("failed", guard(handleExtractFailed));
captureWorker.on("failed", guard(handleCaptureFailed));
diffWorker.on("failed", guard(handleDiffFailed));

const workers = [extractWorker, captureWorker, diffWorker, finalizeWorker];

process.on("SIGTERM", async () => {
  await Promise.all(workers.map((worker) => worker.close()));
  process.exit(0);
});
