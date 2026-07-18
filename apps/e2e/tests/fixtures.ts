/* eslint-disable react-hooks/rules-of-hooks -- Playwright's `use` is not a React hook */
import { readFileSync } from "node:fs";

import { test as base } from "@playwright/test";

import { SEED_ARTIFACT, type SeedData } from "./constants";
import { ProjectBuildsPage } from "./pages/ProjectBuildsPage";
import { SnapshotReviewPage } from "./pages/SnapshotReviewPage";

type TestFixtures = {
  seed: SeedData;
  projectBuildsPage: ProjectBuildsPage;
  snapshotReviewPage: SnapshotReviewPage;
};

export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern -- fixture takes no dependencies
  seed: async ({}, use) => {
    const data = JSON.parse(readFileSync(SEED_ARTIFACT, "utf-8")) as SeedData;
    await use(data);
  },
  projectBuildsPage: async ({ page }, use) => {
    await use(new ProjectBuildsPage(page));
  },
  snapshotReviewPage: async ({ page }, use) => {
    await use(new SnapshotReviewPage(page));
  },
});

export { expect } from "@playwright/test";
