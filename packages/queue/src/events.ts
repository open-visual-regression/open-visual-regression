import { Redis } from "ioredis";
import type IORedis from "ioredis";

import type { BuildProcessingStatus, BuildReviewStatus } from "@ovr/db/schema";
import { createLogger } from "@ovr/logger";

const logger = createLogger("queue");

export type BuildStatusEvent = {
  buildId: string;
  processingStatus: BuildProcessingStatus;
  reviewStatus: BuildReviewStatus;
  errorMessage: string | null;
};

const BUILD_STATUS_CHANNEL_PREFIX = "build-status:";

export const BUILD_STATUS_CHANNEL_PATTERN = `${BUILD_STATUS_CHANNEL_PREFIX}*`;

export const buildStatusChannel = (buildId: string): string =>
  `${BUILD_STATUS_CHANNEL_PREFIX}${buildId}`;

export const publishBuildStatusEvent = async (
  event: BuildStatusEvent,
  connection: IORedis,
): Promise<void> => {
  await connection.publish(buildStatusChannel(event.buildId), JSON.stringify(event));
};

export type BuildStatusSubscriber = {
  close: () => Promise<void>;
};

// Subscribing requires a dedicated connection: a Redis client in subscribe mode
// cannot issue other commands. One subscriber fans out to every build via the pattern.
export const createBuildStatusSubscriber = (
  onEvent: (event: BuildStatusEvent) => void,
  redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379",
): BuildStatusSubscriber => {
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

  void connection.psubscribe(BUILD_STATUS_CHANNEL_PATTERN).catch((error) => {
    logger.error({ err: error }, "failed to subscribe to build status events");
  });

  connection.on("pmessage", (_pattern, _channel, message) => {
    try {
      onEvent(JSON.parse(message) as BuildStatusEvent);
    } catch (error) {
      logger.error({ err: error }, "failed to parse build status event");
    }
  });

  return {
    close: async () => {
      await connection.quit();
    },
  };
};
