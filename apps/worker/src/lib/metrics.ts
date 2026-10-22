import { createServer, type Server } from "node:http";

import { Gauge, Registry } from "prom-client";

import type { createLogger } from "@ovr/logger";
import type { RedisConnection } from "@ovr/queue";

import { readQueueReport } from "./queueReport";

type Logger = ReturnType<typeof createLogger>;

export const startMetricsServer = (
  logger: Logger,
  connection: RedisConnection,
  port: number,
): Server => {
  const registry = new Registry();
  const queueJobs = new Gauge({
    name: "ovr_queue_jobs",
    help: "Jobs in each queue by state, across all workers.",
    labelNames: ["queue", "state"],
    registers: [registry],
  });
  const buildsInFlight = new Gauge({
    name: "ovr_builds_in_flight",
    help: "Builds that are queued or processing.",
    labelNames: ["status"],
    registers: [registry],
  });

  const server = createServer((req, res) => {
    if (req.method !== "GET" || req.url?.split("?")[0] !== "/metrics") {
      res.writeHead(404).end();
      return;
    }

    readQueueReport(connection)
      .then(async ({ queues, builds }) => {
        for (const [queue, depth] of Object.entries(queues)) {
          for (const [state, count] of Object.entries(depth)) {
            queueJobs.set({ queue, state }, count);
          }
        }
        for (const [status, count] of Object.entries(builds)) {
          buildsInFlight.set({ status }, count);
        }
        res.writeHead(200, { "content-type": registry.contentType }).end(await registry.metrics());
      })
      .catch((err: unknown) => {
        logger.warn({ err }, "failed to read metrics");
        res.writeHead(503).end();
      });
  });

  server.on("error", (err) => logger.error({ err, port }, "metrics server error"));
  server.listen(port);
  return server;
};
