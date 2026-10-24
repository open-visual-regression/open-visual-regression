import { vi } from "vitest";

import { createCounter, createHistogram, observeGauge, observeGauges } from "../index";
import { startMetrics } from "../server";
import { describe, expect, test } from "./fixtures";

// Declared before any provider exists, like domain modules.
const jobsCompleted = createCounter<{ queue: string }>("ovr.test.jobs.completed", {
  description: "Jobs completed.",
});
const jobDuration = createHistogram<{ queue: string }>("ovr.test.job.duration.seconds", {
  description: "Job duration.",
  unit: "s",
  buckets: [1, 10],
});

describe("metrics", () => {
  describe("startMetrics", () => {
    test("should stay off when no port is configured", async () => {
      vi.stubEnv("OVR_METRICS_PORT", "");

      expect(await startMetrics({ serviceName: "ovr-test" })).toBeNull();
    });

    test("should stay off rather than stop the app when OVR_METRICS_PORT is mistyped", async () => {
      vi.stubEnv("OVR_METRICS_PORT", "metrics");

      expect(await startMetrics({ serviceName: "ovr-test" })).toBeNull();
    });

    test("should stay off rather than stop the app when the port is taken", async ({ metrics }) => {
      expect(
        await startMetrics({ serviceName: "ovr-test", port: metrics.port, host: "127.0.0.1" }),
      ).toBeNull();
    });

    test("should serve metrics in the Prometheus text format", async ({ scrape }) => {
      const response = await scrape();

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/plain");
    });

    test("should not serve anything but the metrics path", async ({ scrape }) => {
      expect((await scrape("/")).status).toBe(404);
    });

    test("should label every series with the service name", async ({ scrape }) => {
      expect(await (await scrape()).text()).toMatch(/target_info\{.*service_name="ovr-test"/);
    });

    test("should report process runtime metrics", async ({ scrape }) => {
      const body = await (await scrape()).text();

      expect(body).toContain("process_memory_usage_bytes ");
      expect(body).toContain('v8js_memory_heap_used_bytes{v8js_heap_space_name="old_space"}');
      expect(body).toContain('process_cpu_time_seconds_total{cpu_mode="user"}');
      expect(body).toContain("nodejs_eventloop_delay_p99_seconds ");
    });
  });

  describe("createCounter", () => {
    test("should report counts from an instrument declared before metrics started", async ({
      scrape,
    }) => {
      jobsCompleted.add(2, { queue: "snapshot-diff" });

      expect(await (await scrape()).text()).toContain(
        'ovr_test_jobs_completed_total{queue="snapshot-diff"} 2',
      );
    });

    test("should start from zero when metrics restart", async ({ scrape }) => {
      jobsCompleted.add(1, { queue: "snapshot-diff" });

      expect(await (await scrape()).text()).toContain(
        'ovr_test_jobs_completed_total{queue="snapshot-diff"} 1',
      );
    });

    test("should not throw when metrics are off", () => {
      expect(() => jobsCompleted.add(1, { queue: "snapshot-diff" })).not.toThrow();
    });
  });

  describe("createHistogram", () => {
    test("should bucket values with the configured bounds", async ({ scrape }) => {
      jobDuration.record(4, { queue: "build-extract" });

      const body = await (await scrape()).text();

      expect(body).toContain(
        'ovr_test_job_duration_seconds_bucket{queue="build-extract",le="1"} 0',
      );
      expect(body).toContain(
        'ovr_test_job_duration_seconds_bucket{queue="build-extract",le="10"} 1',
      );
      expect(body).toContain('ovr_test_job_duration_seconds_sum{queue="build-extract"} 4');
    });
  });

  describe("observeGauge", () => {
    test("should read the current value on every scrape", async ({ scrape }) => {
      let waiting = 3;
      observeGauge<{ queue: string }>(
        "ovr.test.queue.jobs",
        { description: "Jobs in the queue." },
        (result) => result.observe(waiting, { queue: "snapshot-capture" }),
      );

      expect(await (await scrape()).text()).toContain(
        'ovr_test_queue_jobs{queue="snapshot-capture"} 3',
      );

      waiting = 5;

      expect(await (await scrape()).text()).toContain(
        'ovr_test_queue_jobs{queue="snapshot-capture"} 5',
      );
    });

    test("should stop reporting once removed", async ({ scrape }) => {
      const stop = observeGauge("ovr.test.removed", { description: "Removed gauge." }, (result) =>
        result.observe(1),
      );

      stop();

      expect(await (await scrape()).text()).not.toContain("ovr_test_removed ");
    });
  });

  describe("observeGauges", () => {
    test("should report several gauges from one read per scrape", async ({ scrape }) => {
      let reads = 0;
      observeGauges(
        {
          count: { name: "ovr.test.builds", description: "Builds." },
          age: { name: "ovr.test.builds.age.seconds", description: "Oldest build.", unit: "s" },
        },
        (observe) => {
          reads += 1;
          observe("count", 2, { processing_status: "queued" });
          observe("age", 30, { processing_status: "queued" });
        },
      );

      const body = await (await scrape()).text();

      expect(body).toContain('ovr_test_builds{processing_status="queued"} 2');
      expect(body).toContain('ovr_test_builds_age_seconds{processing_status="queued"} 30');
      expect(reads).toBe(1);
    });
  });
});
