import type { AddressInfo } from "node:net";

import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";
import type { createLogger } from "@ovr/logger";
import { QueueName } from "@ovr/queue";
import { enqueueCaptureGroup } from "@ovr/queue/producer";

import { describe, expect, test } from "../../__tests__/fixtures";
import { startMetricsServer } from "../metrics";
import { startQueueReports, type QueueReport } from "../queueReport";

type Logger = ReturnType<typeof createLogger>;

type LogCall = (fields: Record<string, unknown>, message?: string) => void;

const createTestLogger = () => ({
  info: vi.fn<LogCall>(),
  warn: vi.fn<LogCall>(),
  error: vi.fn<LogCall>(),
});

describe("queue depth report", () => {
  test("logs queue and build counts from one worker per interval, however many run", async ({
    build,
    connection,
  }) => {
    await dbClient.builds.updateProcessingStatus(build.id, "processing");
    await enqueueCaptureGroup({ buildId: build.id, browser: "chromium", snapshotIds: [] });
    const loggers = [createTestLogger(), createTestLogger(), createTestLogger()];

    const stops = loggers.map((logger) =>
      startQueueReports(logger as unknown as Logger, connection, 300),
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    stops.forEach((stop) => stop());

    const reports = loggers.flatMap((logger) =>
      logger.info.mock.calls.filter(([, message]) => message === "queue depth"),
    );
    // Three ticks per worker in that second; one report per tick, not one per worker.
    expect(reports.length).toBeGreaterThanOrEqual(2);
    expect(reports.length).toBeLessThanOrEqual(4);
    expect(reports[0]![0]).toMatchObject({
      builds: { queued: 0, processing: 1 },
      queues: {
        [QueueName.SNAPSHOT_CAPTURE]: expect.objectContaining({ waiting: expect.any(Number) }),
      },
    });
    const [report] = reports[0]! as unknown as [QueueReport];
    expect(report.queues[QueueName.SNAPSHOT_CAPTURE].waiting).toBeGreaterThanOrEqual(1);
  });
});

describe("metrics endpoint", () => {
  test("serves queue and build gauges in the Prometheus text format", async ({
    build: _build,
    connection,
  }) => {
    const server = startMetricsServer(createTestLogger() as unknown as Logger, connection, 0);
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/metrics`);
      const body = await response.text();
      const missing = await fetch(`http://127.0.0.1:${port}/other`);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/plain");
      expect(body).toContain("# TYPE ovr_queue_jobs gauge");
      expect(body).toMatch(/^ovr_queue_jobs\{queue="snapshot-capture",state="waiting"\} \d+$/m);
      expect(body).toContain(`ovr_builds_in_flight{status="queued"} 1`);
      expect(body).toContain(`ovr_builds_in_flight{status="processing"} 0`);
      expect(missing.status).toBe(404);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
