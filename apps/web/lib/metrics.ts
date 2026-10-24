"server only";

import { dbClient } from "@ovr/db/client";
import type { BuildProcessingStatus } from "@ovr/db/schema";
import { createCounter, observeGauge, observeGauges } from "@ovr/metrics";
import type { QueueJobCount } from "@ovr/queue";
import { countQueueJobs } from "@ovr/queue/producer";

export const requestErrors = createCounter<{ route_type: string }>("ovr.http.request.errors", {
  description: "Requests that ended in an unhandled error, by the kind of route that threw.",
});

// Every replica reports the same value, so aggregate with max, not sum.
export const observeQueues = (): (() => void) =>
  observeGauge<Pick<QueueJobCount, "queue" | "state">>(
    "ovr.queue.jobs",
    { description: "Jobs in each queue, by state." },
    async (result) => {
      for (const { queue, state, count } of await countQueueJobs()) {
        result.observe(count, { queue, state });
      }
    },
  );

const IN_PROGRESS_STATUSES = ["queued", "processing"] as const satisfies BuildProcessingStatus[];

export const observeBuildsInProgress = (): (() => void) =>
  observeGauges(
    {
      count: {
        name: "ovr.builds.in_progress",
        description: "Builds that are queued or processing.",
      },
      oldestAge: {
        name: "ovr.builds.in_progress.oldest.age.seconds",
        description: "How long ago the oldest queued or processing build was created.",
        unit: "s",
      },
    },
    async (observe) => {
      const summary = await dbClient.builds.summarizeInProgress();
      for (const status of IN_PROGRESS_STATUSES) {
        const row = summary.find(({ processingStatus }) => processingStatus === status);
        const oldestAge = row?.oldestCreatedAt ? Date.now() - Date.parse(row.oldestCreatedAt) : 0;
        observe("count", row?.count ?? 0, { processing_status: status });
        observe("oldestAge", Math.max(oldestAge, 0) / 1000, { processing_status: status });
      }
    },
  );
