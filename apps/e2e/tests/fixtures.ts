/* eslint-disable react-hooks/rules-of-hooks -- Playwright's `use` is not a React hook */
import { type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";

import { test as base } from "@playwright/test";

import { SEED_ARTIFACT, type SeedData } from "./constants";
import { BuildPage } from "./pages/BuildPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { GitIntegrationSettingsPage } from "./pages/GitIntegrationSettingsPage";
import { IdentityProviderLoginPage } from "./pages/IdentityProviderLoginPage";
import { IntegrationsSettingsPage } from "./pages/IntegrationsSettingsPage";
import { JobsSettingsPage } from "./pages/JobsSettingsPage";
import { OrganizationSettingsPage } from "./pages/OrganizationSettingsPage";
import { ProjectBuildsPage } from "./pages/ProjectBuildsPage";
import { Sidebar } from "./pages/Sidebar";
import { SnapshotReviewPage } from "./pages/SnapshotReviewPage";
import { UsersSettingsPage } from "./pages/UsersSettingsPage";
import { seedClientForContext, type SeedClient } from "./seed/client";
import { gitProviderMock, type GitProviderMock } from "./support/gitProviderMock";
import { spawnIngest, type IngestOptions } from "./support/ingest";

type ConnectedProject = {
  projectId: string;
  projectName: string;
  apiKey: string;
};

type TestFixtures = {
  seed: SeedData;
  seedClient: SeedClient;
  projectBuildsPage: ProjectBuildsPage;
  snapshotReviewPage: SnapshotReviewPage;
  buildPage: BuildPage;
  jobsSettingsPage: JobsSettingsPage;
  organizationSettingsPage: OrganizationSettingsPage;
  sidebar: Sidebar;
  identityProviderLoginPage: IdentityProviderLoginPage;
  forbiddenPage: ForbiddenPage;
  usersSettingsPage: UsersSettingsPage;
  integrationsSettingsPage: IntegrationsSettingsPage;
  gitIntegrationSettingsPage: GitIntegrationSettingsPage;
  gitProviderMock: GitProviderMock;
  connectedProject: ConnectedProject;
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
  jobsSettingsPage: async ({ page }, use) => {
    await use(new JobsSettingsPage(page));
  },
  organizationSettingsPage: async ({ page }, use) => {
    await use(new OrganizationSettingsPage(page));
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
  integrationsSettingsPage: async ({ page }, use) => {
    await use(new IntegrationsSettingsPage(page));
  },
  gitIntegrationSettingsPage: async ({ page }, use) => {
    await use(new GitIntegrationSettingsPage(page));
  },
  // Starts each test with a mock that has forgotten earlier requests, tokens and failures.
  // eslint-disable-next-line no-empty-pattern -- fixture takes no dependencies
  gitProviderMock: async ({}, use) => {
    await gitProviderMock.reset();
    await use(gitProviderMock);
  },
  // A fresh project with an API key, so a test's git integration doesn't touch the shared seed.
  connectedProject: async ({ seedClient }, use, testInfo) => {
    const projectName = `E2E ${testInfo.title.slice(0, 40)} ${Date.now()}`;
    const { projectId } = await seedClient.projects.add({
      projectName,
      projectDescription: "Project created for a git provider E2E test",
      gitMainBranch: "main",
    });
    const { key } = await seedClient.apiKeys.create({ projectId, name: "e2e" });
    await use({ projectId, projectName, apiKey: key });
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
