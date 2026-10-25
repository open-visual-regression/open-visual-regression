import type { Processor } from "bullmq";
import { vi } from "vitest";

import { QueueName } from "@ovr/queue";

import { describe, expect, test } from "../../__tests__/fixtures";
import { observeJobs } from "../jobMetrics";

const QUEUE = QueueName.FLAKY_SNAPSHOT_SCAN;

describe("observeJobs", () => {
  test("should count a completed job and record how long it waited and ran", async ({
    openQueue,
    openWorker,
    trackJob,
    metrics,
  }) => {
    observeJobs(openWorker(QUEUE, async () => undefined));

    trackJob(await openQueue(QUEUE).add("job", {}));

    await vi.waitFor(async () => {
      const body = await metrics.scrape();
      expect(body).toContain(`ovr_job_attempts_total{queue="${QUEUE}",outcome="completed"} 1`);
      expect(body).toContain(
        `ovr_job_duration_seconds_count{queue="${QUEUE}",outcome="completed"} 1`,
      );
      expect(body).toContain(`ovr_job_wait_seconds_count{queue="${QUEUE}"} 1`);
    });
  });

  test("should count a failed attempt with retries left as retried, and the last as failed", async ({
    openQueue,
    openWorker,
    trackJob,
    metrics,
  }) => {
    observeJobs(
      openWorker(QUEUE, async () => {
        throw new Error("boom");
      }),
    );

    trackJob(await openQueue(QUEUE).add("job", {}, { attempts: 2 }));

    await vi.waitFor(async () => {
      const body = await metrics.scrape();
      expect(body).toContain(`ovr_job_attempts_total{queue="${QUEUE}",outcome="retried"} 1`);
      expect(body).toContain(`ovr_job_attempts_total{queue="${QUEUE}",outcome="failed"} 1`);
    });
  });

  test("should record queue wait for the first attempt only", async ({
    openQueue,
    openWorker,
    trackJob,
    metrics,
  }) => {
    const processor = vi.fn<Processor>().mockRejectedValueOnce(new Error("first attempt fails"));
    observeJobs(openWorker(QUEUE, processor));

    trackJob(await openQueue(QUEUE).add("job", {}, { attempts: 2 }));

    await vi.waitFor(async () => {
      const body = await metrics.scrape();
      expect(body).toContain(`ovr_job_attempts_total{queue="${QUEUE}",outcome="completed"} 1`);
      expect(body).toContain(`ovr_job_wait_seconds_count{queue="${QUEUE}"} 1`);
    });
  });
});
