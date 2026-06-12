import { Redis } from "ioredis";
import { test as vitest } from "vitest";

export { describe, expect } from "vitest";

type Fixtures = {
  connection: Redis;
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
});
