"use server";

import { ORPCError } from "@orpc/server";

import { db, sql } from "@ovr/db/db";
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

const checkDb = async (): Promise<"ok" | "error"> => {
  try {
    await withTimeout(db.execute(sql`select 1`), "db");
    return "ok";
  } catch (err) {
    logger.error({ err, check: "db" }, "health check failed");
    return "error";
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

/**
 * Liveness deliberately touches no dependency. Every replica shares one database
 * and one Redis, so failing this on a dependency outage would restart the whole
 * fleet into CrashLoopBackOff over something a restart cannot fix.
 */
export const live = os.health.live.handler(() => ({ status: "ok" as const })).actionable();

export const ready = os.health.ready
  .handler(async () => {
    const [dbStatus, redisStatus] = await Promise.all([checkDb(), checkRedis()]);
    const checks = { db: dbStatus, redis: redisStatus };

    // Postgres is a hard dependency: a session is resolved from it on every
    // authenticated request, so a replica that cannot reach it serves nothing.
    if (dbStatus !== "ok") {
      throw new ORPCError("SERVICE_UNAVAILABLE", { data: { checks } });
    }

    // Redis only backs job enqueueing and live build-status streaming. Reporting
    // it keeps the outage visible without pulling every replica out of rotation
    // for a partial loss of function.
    return { status: redisStatus === "ok" ? ("ok" as const) : ("degraded" as const), checks };
  })
  .actionable();
