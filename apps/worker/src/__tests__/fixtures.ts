import type { AddressInfo } from "node:net";

import { Queue, type Job } from "bullmq";
import { v7 as uuidv7 } from "uuid";
import { test as vitest, vi, type Mock } from "vitest";

import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { organization, projects, user as userTable } from "@ovr/db/schema";
import type { createLogger } from "@ovr/logger";
import { buildRedisConnection, type QueueName, type RedisConnection } from "@ovr/queue";

import { startMetricsServer } from "../lib/metrics";

export { describe, expect } from "vitest";

type Viewport = {
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  viewportName: string;
};

type LogCall = (fields: Record<string, unknown>, message?: string) => void;

export type MockLogger = ReturnType<typeof createLogger> & {
  info: Mock<LogCall>;
  warn: Mock<LogCall>;
  error: Mock<LogCall>;
};

type Fixtures = {
  user: typeof userTable.$inferSelect;
  organization: typeof organization.$inferSelect;
  project: typeof projects.$inferSelect;
  captureConfiguration: Viewport;
  build: NonNullable<Awaited<ReturnType<typeof dbClient.builds.create>>>;
  connection: RedisConnection;
  createMockLogger: () => MockLogger;
  metricsUrl: string;
  openQueue: (name: QueueName) => Queue;
  trackJob: <T extends Job>(job: T) => T;
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

  // eslint-disable-next-line no-empty-pattern
  createMockLogger: async ({}, use) => {
    await use(
      () =>
        ({
          info: vi.fn<LogCall>(),
          warn: vi.fn<LogCall>(),
          error: vi.fn<LogCall>(),
        }) as unknown as MockLogger,
    );
  },

  metricsUrl: async ({ connection, createMockLogger }, use) => {
    const server = startMetricsServer(createMockLogger(), connection, 0);
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;

    await use(`http://127.0.0.1:${port}`);

    await new Promise((resolve) => server.close(resolve));
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

  // eslint-disable-next-line no-empty-pattern
  trackJob: async ({}, use) => {
    const jobs: Job[] = [];

    await use((job) => {
      jobs.push(job);
      return job;
    });

    await Promise.all(jobs.map((job) => job.remove()));
  },
});
