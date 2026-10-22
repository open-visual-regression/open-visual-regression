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

// Counts are cluster-wide, so only the worker holding the lock logs them.
export const reportQueueDepth = async (
  logger: Logger,
  connection: RedisConnection,
  lockTtlMs: number,
): Promise<void> => {
  if (await tryAcquireLock(connection, REPORT_LOCK, lockTtlMs)) {
    logger.info(await readQueueReport(connection), "queue depth");
  }
};

export const startQueueReports = (
  logger: Logger,
  connection: RedisConnection,
  intervalMs: number,
): (() => void) => {
  const lockTtlMs = Math.max(1, Math.floor(intervalMs * 0.9));

  const timer = setInterval(() => {
    reportQueueDepth(logger, connection, lockTtlMs).catch((err: unknown) =>
      logger.warn({ err }, "failed to read queue depth"),
    );
  }, intervalMs);
  timer.unref();

  return () => clearInterval(timer);
};
