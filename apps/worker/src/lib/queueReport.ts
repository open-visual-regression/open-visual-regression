import { dbClient } from "@ovr/db/client";
import type { InFlightBuildCounts } from "@ovr/db/repository/builds";
import type { createLogger } from "@ovr/logger";
import {
  getQueueDepths,
  tryAcquireLock,
  type QueueDepth,
  type QueueName,
  type RedisConnection,
} from "@ovr/queue";

type Logger = ReturnType<typeof createLogger>;

export type QueueReport = {
  queues: Record<QueueName, QueueDepth>;
  builds: InFlightBuildCounts;
};

export const readQueueReport = async (connection: RedisConnection): Promise<QueueReport> => {
  const [queues, builds] = await Promise.all([
    getQueueDepths(connection),
    dbClient.builds.countInFlight(),
  ]);
  return { queues, builds };
};

const REPORT_LOCK = "queue-depth-report";

// Counts are cluster-wide, so only the worker that claims the interval logs them. The lock
// expires a little before the next tick so the claim moves freely between workers.
export const startQueueReports = (
  logger: Logger,
  connection: RedisConnection,
  intervalMs: number,
): (() => void) => {
  const lockTtlMs = Math.max(1, Math.floor(intervalMs * 0.9));

  const timer = setInterval(() => {
    tryAcquireLock(connection, REPORT_LOCK, lockTtlMs)
      .then(async (claimed) => {
        if (claimed) {
          logger.info(await readQueueReport(connection), "queue depth");
        }
      })
      .catch((err: unknown) => logger.warn({ err }, "failed to read queue depth"));
  }, intervalMs);
  timer.unref();

  return () => clearInterval(timer);
};
