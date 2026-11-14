/* eslint-disable react-hooks/rules-of-hooks -- Playwright's `use` is not a React hook */
import { type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { test as base } from "@playwright/test";

import { SEED_ARTIFACT, type SeedData } from "./constants";
import { BuildPage } from "./pages/BuildPage";
import { BuildsPage } from "./pages/BuildsPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { IdentityProviderLoginPage } from "./pages/IdentityProviderLoginPage";
import { JobsSettingsPage } from "./pages/JobsSettingsPage";
import { LoginPage } from "./pages/LoginPage";
import { OrganizationSettingsPage } from "./pages/OrganizationSettingsPage";
import { OverviewPage } from "./pages/OverviewPage";
import { ProjectBuildsPage } from "./pages/ProjectBuildsPage";
import { Sidebar } from "./pages/Sidebar";
import { SnapshotReviewPage } from "./pages/SnapshotReviewPage";
import { SnapshotsPage } from "./pages/SnapshotsPage";
import { UsersSettingsPage } from "./pages/UsersSettingsPage";
import { seedClientForContext, type SeedClient } from "./seed/client";
import { spawnIngest, STORYBOOK_DIR, type IngestOptions } from "./support/ingest";

const SMALL_STORYBOOK_STORIES = 3;

type TestFixtures = {
  seed: SeedData;
  seedClient: SeedClient;
  projectBuildsPage: ProjectBuildsPage;
  snapshotReviewPage: SnapshotReviewPage;
  buildPage: BuildPage;
  buildsPage: BuildsPage;
  jobsSettingsPage: JobsSettingsPage;
  loginPage: LoginPage;
  organizationSettingsPage: OrganizationSettingsPage;
  overviewPage: OverviewPage;
  snapshotsPage: SnapshotsPage;
  sidebar: Sidebar;
  identityProviderLoginPage: IdentityProviderLoginPage;
  forbiddenPage: ForbiddenPage;
  usersSettingsPage: UsersSettingsPage;
  ingestBuild: (options: IngestOptions & { commitSha: string }) => ChildProcess;
};

type WorkerFixtures = {
  smallStorybookDir: string;
};

type StorybookIndex = {
  entries: Record<string, { type: string }>;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  smallStorybookDir: [
    // eslint-disable-next-line no-empty-pattern -- fixture takes no dependencies
    async ({}, use) => {
      const workDir = await mkdtemp(path.join(tmpdir(), "ovr-e2e-storybook-"));
      const dir = path.join(workDir, "storybook");
      await cp(STORYBOOK_DIR, dir, { recursive: true });
      const indexPath = path.join(dir, "index.json");
      const index = JSON.parse(await readFile(indexPath, "utf-8")) as StorybookIndex;
      const stories = Object.entries(index.entries)
        .filter(([, entry]) => entry.type === "story")
        .slice(0, SMALL_STORYBOOK_STORIES);
      await writeFile(
        indexPath,
        JSON.stringify({ ...index, entries: Object.fromEntries(stories) }),
      );

      await use(dir);

      await rm(workDir, { recursive: true, force: true });
    },
    { scope: "worker" },
  ],
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
  buildsPage: async ({ page }, use) => {
    await use(new BuildsPage(page));
  },
  jobsSettingsPage: async ({ page }, use) => {
    await use(new JobsSettingsPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  organizationSettingsPage: async ({ page }, use) => {
    await use(new OrganizationSettingsPage(page));
  },
  overviewPage: async ({ page }, use) => {
    await use(new OverviewPage(page));
  },
  snapshotsPage: async ({ page }, use) => {
    await use(new SnapshotsPage(page));
  },
  sidebar: async ({ page }, use) => {
    await use(new Sidebar(page));
  },
  identityProviderLoginPage: async ({ page }, use) => {
    await use(new IdentityProviderLoginPage(page));
  },
  forbiddenPage: async ({ page }, use) => {
    await use(new ForbiddenPage(page));
  },
  usersSettingsPage: async ({ page }, use) => {
    await use(new UsersSettingsPage(page));
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
