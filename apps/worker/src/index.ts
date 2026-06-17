import { Worker } from "bullmq";
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

const guard =
  <T>(fn: (job: T) => Promise<void>) =>
  (job: T | undefined) => {
    if (!job) {
      return;
    }
    fn(job).catch((error: unknown) => {
      console.error("Error while handling job failure:", error);
    });
  };

extractWorker.on("failed", guard(extract.failed));
captureWorker.on("failed", guard(capture.failed));
diffWorker.on("failed", guard(diff.failed));

const workers = [extractWorker, captureWorker, diffWorker, finalizeWorker];

process.on("SIGTERM", async () => {
  await Promise.all(workers.map((worker) => worker.close()));
  process.exit(0);
});
