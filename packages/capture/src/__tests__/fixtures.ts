import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Redis } from "ioredis";
import type { Page } from "playwright";
import { chromium } from "playwright";
import * as tar from "tar";
import { v7 as uuidv7 } from "uuid";
import { test as vitest } from "vitest";

import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { organization, projects, user as userTable } from "@ovr/db/schema";
import { buildRedisConnection } from "@ovr/queue";
import { storage } from "@ovr/storage";

import { newPage } from "../lib/browser";
import { startStaticProxy } from "../lib/staticProxy";

export { describe, expect } from "vitest";

export const writeStorybookBuildMarkers = async (dir: string): Promise<void> => {
  await writeFile(path.join(dir, "index.json"), JSON.stringify({ v: 5, entries: {} }));
  await writeFile(path.join(dir, "project.json"), JSON.stringify({ storybookVersion: "10.5.10" }));
};

export const uploadArtifactWithIframe = async (
  artifactPath: string,
  iframeHtml: string,
): Promise<void> => {
  const sourceDir = await mkdtemp(path.join(tmpdir(), "ovr-snapshot-fixture-"));

  try {
    await writeFile(path.join(sourceDir, "iframe.html"), iframeHtml);
    await writeStorybookBuildMarkers(sourceDir);

    const tarballPath = path.join(sourceDir, "..", `${path.basename(sourceDir)}.tar.gz`);
    await tar.create({ gzip: true, file: tarballPath, cwd: sourceDir }, ["."]);
    const tarball = await readFile(tarballPath);
    await rm(tarballPath, { force: true });

    await storage.uploadFile(artifactPath, tarball, "application/gzip");
  } finally {
    await rm(sourceDir, { recursive: true, force: true });
  }
};

export const withCapturePage = async (
  buildDir: string,
  run: (page: Page) => Promise<void>,
): Promise<void> => {
  const proxy = await startStaticProxy(buildDir);
  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });

  try {
    const page = await newPage(await browser.newContext());
    await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });
    await run(page);
  } finally {
    await browser.close();
    proxy.close();
  }
};

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
  mainBuild: NonNullable<Awaited<ReturnType<typeof dbClient.builds.create>>>;
  featureBuild: NonNullable<Awaited<ReturnType<typeof dbClient.builds.create>>>;
  connection: Redis;
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

  mainBuild: async ({ project, user }, use) => {
    const created = await dbClient.builds.create({
      projectId: project.id,
      branch: "main",
      commitSha: "a".repeat(40),
      artifactPath: "builds/seed/artifact",
      createdBy: user.id,
    });
    await use(created!);
  },

  featureBuild: async ({ project, user }, use) => {
    const created = await dbClient.builds.create({
      projectId: project.id,
      branch: "feature/test",
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
});
