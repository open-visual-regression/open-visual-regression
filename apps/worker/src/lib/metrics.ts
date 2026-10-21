import { createServer, type Server } from "node:http";

import type { createLogger } from "@ovr/logger";
import type { RedisConnection } from "@ovr/queue";

import { readQueueReport, type QueueReport } from "./queueReport";

type Logger = ReturnType<typeof createLogger>;

export const formatMetrics = ({ queues, builds }: QueueReport): string => {
  const lines = [
    "# HELP ovr_queue_jobs Jobs in each queue by state, across all workers.",
    "# TYPE ovr_queue_jobs gauge",
    ...Object.entries(queues).flatMap(([queue, depth]) =>
      Object.entries(depth).map(
        ([state, count]) => `ovr_queue_jobs{queue="${queue}",state="${state}"} ${count}`,
      ),
    ),
    "# HELP ovr_builds_in_flight Builds that are queued or processing.",
    "# TYPE ovr_builds_in_flight gauge",
    ...Object.entries(builds).map(
      ([status, count]) => `ovr_builds_in_flight{status="${status}"} ${count}`,
    ),
  ];
  return `${lines.join("\n")}\n`;
};

export const startMetricsServer = (
  logger: Logger,
  connection: RedisConnection,
  port: number,
): Server => {
  const server = createServer((req, res) => {
    if (req.method !== "GET" || req.url?.split("?")[0] !== "/metrics") {
      res.writeHead(404).end();
      return;
    }

    readQueueReport(connection).then(
      (report) => {
        res
          .writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" })
          .end(formatMetrics(report));
      },
      (err: unknown) => {
        logger.warn({ err }, "failed to read metrics");
        res.writeHead(503).end();
      },
    );
  });

  server.on("error", (err) => logger.error({ err, port }, "metrics server error"));
  server.listen(port);
  return server;
};
