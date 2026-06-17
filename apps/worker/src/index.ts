import { Worker } from "bullmq";
import { Redis } from "ioredis";

import { QueueName } from "@ovr/queue";

import { capture, captureFailed } from "./handlers/capture";
import { diff, diffFailed } from "./handlers/diff";
import { extract, extractFailed } from "./handlers/extract";
import { finalize } from "./handlers/finalize";

const connection = new Redis(process.env.VALKEY_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const extractWorker = new Worker(QueueName.BUILD_EXTRACT, extract, { connection });
const captureWorker = new Worker(QueueName.SNAPSHOT_CAPTURE, capture, { connection });
const diffWorker = new Worker(QueueName.SNAPSHOT_DIFF, diff, { connection });
const finalizeWorker = new Worker(QueueName.BUILD_FINALIZE, finalize, { connection });

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

extractWorker.on("failed", guard(extractFailed));
captureWorker.on("failed", guard(captureFailed));
diffWorker.on("failed", guard(diffFailed));

const workers = [extractWorker, captureWorker, diffWorker, finalizeWorker];

process.on("SIGTERM", async () => {
  await Promise.all(workers.map((worker) => worker.close()));
  process.exit(0);
});
