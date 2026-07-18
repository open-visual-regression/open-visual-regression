/* eslint-disable react-hooks/rules-of-hooks -- Playwright's `use` is not a React hook */
import { readFileSync } from "node:fs";

import { test as base } from "@playwright/test";

import { SEED_ARTIFACT, type SeedData } from "./constants";
import { ProjectBuildsPage } from "./pages/ProjectBuildsPage";
import { SnapshotReviewPage } from "./pages/SnapshotReviewPage";
import { seedClientForContext, type SeedClient } from "./seed/client";

type TestFixtures = {
  seed: SeedData;
  seedClient: SeedClient;
  projectBuildsPage: ProjectBuildsPage;
  snapshotReviewPage: SnapshotReviewPage;
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
});

export { expect } from "@playwright/test";
