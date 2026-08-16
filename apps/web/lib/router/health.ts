"use server";

import { createLogger } from "@ovr/logger";
import { buildRedisConnection } from "@ovr/queue";

import { os } from "./os";

const logger = createLogger("health");

const CHECK_TIMEOUT_MS = 2_000;

const withTimeout = async <T>(operation: Promise<T>, check: string): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${check} check timed out after ${CHECK_TIMEOUT_MS}ms`)),
          CHECK_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

const checkRedis = async (): Promise<"ok" | "error"> => {
  const connection = buildRedisConnection(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });

  connection.on("error", () => {});

  try {
    await withTimeout(
      (async () => {
        await connection.connect();
        await connection.ping();
      })(),
      "redis",
    );
    return "ok";
  } catch (err) {
    logger.error({ err, check: "redis" }, "health check failed");
    return "error";
  } finally {
    connection.disconnect();
  }
};

export const live = os.health.live.handler(() => ({ status: "ok" as const })).actionable();

export const ready = os.health.ready
  .handler(async () => {
    const redisStatus = await checkRedis();

    return {
      status: redisStatus === "ok" ? ("ok" as const) : ("degraded" as const),
      checks: { redis: redisStatus },
    };
  })
  .actionable();
