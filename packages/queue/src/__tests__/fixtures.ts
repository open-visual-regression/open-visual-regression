import { Queue } from "bullmq";
import type { Job } from "bullmq";
import { Redis, type RedisOptions } from "ioredis";
import { test as vitest, vi } from "vitest";

import { buildRedisConnection, type QueueName, type RedisConnection } from "../index";

export { describe, expect } from "vitest";

type Fixtures = {
  connection: Redis;
  openConnection: (options?: RedisOptions) => Redis;
  clusterUrl: string;
  clusterConnection: RedisConnection;
  openQueue: (name: QueueName) => Queue;
  trackJob: <T extends Job>(job: T) => T;
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
  openConnection: async ({}, use) => {
    const connections: Redis[] = [];

    await use((options) => {
      const connection = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        maxRetriesPerRequest: null,
        ...options,
      });
      connection.on("error", () => undefined);
      connections.push(connection);
      return connection;
    });

    for (const connection of connections) {
      connection.disconnect();
    }
  },

  openQueue: async ({ connection }, use) => {
    const queues: Queue[] = [];

    await use((name) => {
      const queue = new Queue(name, { connection });
      queues.push(queue);
      return queue;
    });

    for (const queue of queues) {
      const schedulers = await queue.getJobSchedulers();
      await Promise.all(schedulers.map((scheduler) => queue.removeJobScheduler(scheduler.key)));
      await queue.close();
    }
  },

  // eslint-disable-next-line no-empty-pattern
  trackJob: async ({}, use) => {
    const jobs: Job[] = [];

    await use((job) => {
      jobs.push(job);
      return job;
    });

    await Promise.all(jobs.map((job) => job.remove()));
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
