/* eslint-disable react-hooks/rules-of-hooks -- Playwright's `use` is not a React hook */
import { type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";

import { test as base } from "@playwright/test";

import { SEED_ARTIFACT, type SeedData } from "./constants";
import { BuildPage } from "./pages/BuildPage";
import { ProjectBuildsPage } from "./pages/ProjectBuildsPage";
import { SnapshotReviewPage } from "./pages/SnapshotReviewPage";
import { seedClientForContext, type SeedClient } from "./seed/client";
import { spawnIngest, type IngestOptions } from "./support/ingest";

type TestFixtures = {
  seed: SeedData;
  seedClient: SeedClient;
  projectBuildsPage: ProjectBuildsPage;
  snapshotReviewPage: SnapshotReviewPage;
  buildPage: BuildPage;
  ingestBuild: (options: IngestOptions & { commitSha: string }) => ChildProcess;
};

export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern -- fixture takes no dependencies
  seed: async ({}, use) => {
    const data = JSON.parse(readFileSync(SEED_ARTIFACT, "utf-8")) as SeedData;
    await use(data);
  },
  seedClient: async ({ context }, use) => {
    await use(await seedClientForContext(context));
  },
  projectBuildsPage: async ({ page }, use) => {
    await use(new ProjectBuildsPage(page));
  },
  snapshotReviewPage: async ({ page }, use) => {
    await use(new SnapshotReviewPage(page));
  },
  buildPage: async ({ page }, use) => {
    await use(new BuildPage(page));
  },
  // eslint-disable-next-line no-empty-pattern -- fixture takes no dependencies
  ingestBuild: async ({}, use) => {
    const processes: ChildProcess[] = [];
    await use((options) => {
      const child = spawnIngest(options);
      processes.push(child);
      return child;
    });
    for (const child of processes) {
      child.kill();
    }
  },
});

export { expect } from "@playwright/test";
