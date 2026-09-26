import { Redis } from "ioredis";
import { test as vitest, vi } from "vitest";

import { buildRedisConnection, type RedisConnection } from "../index";

export { describe, expect } from "vitest";

type Fixtures = {
  connection: Redis;
  clusterUrl: string;
  clusterConnection: RedisConnection;
};

export const test = vitest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  connection: async ({}, use) => {
    const connection = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      maxRetriesPerRequest: null,
    });

    await use(connection);

    await connection.quit();
  },

  // eslint-disable-next-line no-empty-pattern
  clusterUrl: async ({}, use) => {
    vi.stubEnv("REDIS_MODE", "cluster");
    await use(process.env.REDIS_CLUSTER_URL ?? "");
  },

  clusterConnection: async ({ clusterUrl }, use) => {
    const connection = buildRedisConnection(clusterUrl, { maxRetriesPerRequest: null });

    await use(connection);

    await connection.quit();
  },
});
