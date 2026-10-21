import type { AddressInfo } from "node:net";

import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";
import type { createLogger } from "@ovr/logger";
import { QueueName } from "@ovr/queue";

import { describe, expect, test } from "../../__tests__/fixtures";
import { startMetricsServer } from "../metrics";
import { reportQueueDepth } from "../queueReport";

type Logger = ReturnType<typeof createLogger>;

type LogCall = (fields: Record<string, unknown>, message?: string) => void;

const createTestLogger = () => ({
  info: vi.fn<LogCall>(),
  warn: vi.fn<LogCall>(),
  error: vi.fn<LogCall>(),
});

describe("queue depth report", () => {
  test("logs queue and build counts from only one of several workers", async ({
    build,
    connection,
  }) => {
    await dbClient.builds.updateProcessingStatus(build.id, "processing");
    const loggers = [createTestLogger(), createTestLogger(), createTestLogger()];

    await Promise.all(
      loggers.map((logger) => reportQueueDepth(logger as unknown as Logger, connection, 1000)),
    );

    const reports = loggers.flatMap((logger) => logger.info.mock.calls);
    expect(reports).toEqual([
      [
        expect.objectContaining({
          builds: { queued: 0, processing: 1 },
          queues: expect.objectContaining({
            [QueueName.SNAPSHOT_CAPTURE]: expect.objectContaining({ waiting: expect.any(Number) }),
          }),
        }),
        "queue depth",
      ],
    ]);
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
