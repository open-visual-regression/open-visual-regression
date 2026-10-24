import { spawn, type ChildProcess } from "node:child_process";

import { Queue, Worker, type Job, type Processor, type WorkerOptions } from "bullmq";
import { v7 as uuidv7 } from "uuid";
import { test as vitest } from "vitest";

import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { organization, projects, user as userTable } from "@ovr/db/schema";
import { metricsFixture, type TestMetrics } from "@ovr/metrics/testing";
import { buildRedisConnection, type QueueName, type RedisConnection } from "@ovr/queue";

export { describe, expect } from "vitest";

type Viewport = {
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  viewportName: string;
};

type Fixtures = {
  user: typeof userTable.$inferSelect;
  organization: typeof organization.$inferSelect;
  project: typeof projects.$inferSelect;
  captureConfiguration: Viewport;
  build: NonNullable<Awaited<ReturnType<typeof dbClient.builds.create>>>;
  connection: RedisConnection;
  openQueue: (name: QueueName) => Queue;
  openWorker: (
    name: QueueName,
    processor: Processor,
    options?: Omit<WorkerOptions, "connection">,
  ) => Worker;
  trackJob: <T extends Job>(job: T) => T;
  metrics: TestMetrics;
  /** Stands in for a launched browser. */
  childProcess: ChildProcess;
};

export const test = vitest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  user: async ({}, use) => {
    const [created] = await db
      .insert(userTable)
      .values({ id: uuidv7(), name: "Test User", email: `${uuidv7()}@example.com` })
      .returning();
    await use(created!);
  },

  // eslint-disable-next-line no-empty-pattern
  organization: async ({}, use) => {
    const [created] = await db
      .insert(organization)
      .values({ id: uuidv7(), name: "Test Org", slug: uuidv7(), createdAt: new Date() })
      .returning();
    await use(created!);
  },

  project: async ({ user, organization }, use) => {
    const [created] = await db
      .insert(projects)
      .values({
        name: "Test Project",
        gitMainBranch: "main",
        organizationId: organization.id,
        creatorId: user.id,
      })
      .returning();
    await use(created!);
  },

  // eslint-disable-next-line no-empty-pattern
  captureConfiguration: async ({}, use) => {
    await use({
      browser: "chromium",
      viewportWidth: 1280,
      viewportHeight: 800,
      viewportName: "desktop",
    });
  },

  build: async ({ project, user }, use) => {
    const created = await dbClient.builds.create({
      projectId: project.id,
      branch: "main",
      commitSha: "a".repeat(40),
      artifactPath: "builds/seed/artifact",
      createdBy: user.id,
    });
    await use(created!);
  },

  // eslint-disable-next-line no-empty-pattern
  connection: async ({}, use) => {
    const connection = buildRedisConnection(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });

    await use(connection);

    await connection.quit();
  },

  openQueue: async ({ connection }, use) => {
    const queues: Queue[] = [];

    await use((name) => {
      const queue = new Queue(name, { connection });
      queues.push(queue);
      return queue;
    });

    await Promise.all(queues.map((queue) => queue.close()));
  },

  openWorker: async ({ connection }, use) => {
    const workers: Worker[] = [];

    await use((name, processor, options) => {
      const worker = new Worker(name, processor, { connection, ...options });
      workers.push(worker);
      return worker;
    });

    await Promise.all(workers.map((worker) => worker.close()));
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

  metrics: metricsFixture,

  // eslint-disable-next-line no-empty-pattern
  childProcess: async ({}, use) => {
    const child = spawn("sleep", ["30"]);
    await use(child);
    child.kill();
  },
});
