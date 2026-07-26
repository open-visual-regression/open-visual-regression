"use server";

import { ORPCError } from "@orpc/server";

import { db, sql } from "@ovr/db/db";
import { createLogger } from "@ovr/logger";
import { buildRedisConnection } from "@ovr/queue";

import { os } from "./os";

const logger = createLogger("health");

const checkDb = async (): Promise<"ok" | "error"> => {
  try {
    await db.execute(sql`select 1`);
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
    await connection.connect();
    await connection.ping();
    return "ok";
  } catch (err) {
    logger.error({ err, check: "redis" }, "health check failed");
    return "error";
  } finally {
    connection.disconnect();
  }
};

export const check = os.health.check
  .handler(async () => {
    const [dbStatus, redisStatus] = await Promise.all([checkDb(), checkRedis()]);
    const checks = { db: dbStatus, redis: redisStatus };

    if (dbStatus !== "ok" || redisStatus !== "ok") {
      throw new ORPCError("SERVICE_UNAVAILABLE", { data: { checks } });
    }

    return { status: "ok" as const, checks };
  })
  .actionable();
