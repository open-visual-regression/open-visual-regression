import { randomBytes } from "node:crypto";

import { expect, test } from "../fixtures";
import { GitIntegrationSettingsPage } from "../pages/GitIntegrationSettingsPage";
import { IntegrationsSettingsPage } from "../pages/IntegrationsSettingsPage";
import { fakeGithub, type ReceivedStatus } from "../support/fakeGithub";
import { ingestStorybook } from "../support/ingest";

const REPOSITORY = { id: 101, fullName: "ovr-e2e-org/web" };

const statusesFor = async (sha: string): Promise<ReceivedStatus[]> =>
  (await fakeGithub.requests()).statuses.filter((status) => status.sha === sha);

const latestStateFor = async (sha: string) => (await statusesFor(sha)).at(-1)?.state ?? null;

test.beforeEach(async () => {
  await fakeGithub.reset();
});

test("settings show the github app and where it is installed", async ({ page }) => {
  const integrationsPage = new IntegrationsSettingsPage(page);
  await integrationsPage.goto();

  await expect(integrationsPage.appName("ovr-e2e")).toBeVisible();
  await expect(integrationsPage.connectedBadge()).toBeVisible();
  await expect(integrationsPage.installation("ovr-e2e-org")).toContainText("2 repositories");
});

test("a project linked through the github app posts commit statuses", async ({
  page,
  seedClient,
}) => {
  const projectName = `E2E GitHub App ${Date.now()}`;
  const { projectId } = await seedClient.projects.add({
    projectName,
    projectDescription: "Project used by the GitHub App E2E test",
    gitMainBranch: "main",
  });
  const { key } = await seedClient.apiKeys.create({ projectId, name: "e2e-github-app" });

  const settingsPage = new GitIntegrationSettingsPage(page);
  await settingsPage.goto(projectId);

  await expect(settingsPage.authenticationSelect()).toContainText("github app");
  await settingsPage.chooseRepository(REPOSITORY.fullName);
  await settingsPage.saveButton().click();
  await expect(settingsPage.toast("git integration saved")).toBeVisible();

  await settingsPage.testConnectionButton().click();
  await expect(settingsPage.toast("connection ok")).toBeVisible();

  // A feature-branch build on a project with no baselines needs review.
  const commitSha = randomBytes(20).toString("hex");
  const build = await ingestStorybook({ apiKey: key, branch: "feature/github-app", commitSha });

  await expect.poll(() => latestStateFor(commitSha), { timeout: 120_000 }).toBe("failure");

  const { builds } = await seedClient.builds.list({ projectIds: [projectId] });
  const buildId = builds.find((candidate) => candidate.commitSha === build.commitSha)?.id;
  if (!buildId) {
    throw new Error(`Could not find the ingested build for commit ${build.commitSha}`);
  }

  const statuses = await statusesFor(commitSha);
  expect(statuses[0]).toMatchObject({ repository: REPOSITORY.fullName, state: "pending" });
  expect(statuses.at(-1)).toMatchObject({
    repository: REPOSITORY.fullName,
    state: "failure",
    description: "visual changes need review",
    context: `Open Visual Regression / ${projectName}`,
  });
  expect(statuses.at(-1)?.target_url).toMatch(
    new RegExp(`/projects/${projectId}/builds/${buildId}$`),
  );

  // Every status token was scoped to the linked repository.
  const { tokenRequests } = await fakeGithub.requests();
  const statusTokens = tokenRequests.filter((request) => request.permissions?.statuses);
  expect(statusTokens.length).toBeGreaterThan(0);
  for (const request of statusTokens) {
    expect(request).toEqual({
      repository_ids: [REPOSITORY.id],
      permissions: { statuses: "write", metadata: "read" },
    });
  }

  // A token GitHub rejects is replaced and the status is sent again.
  await fakeGithub.failNext("POST", `/repos/${REPOSITORY.fullName}/statuses/${commitSha}`, 401);
  const mintedBefore = tokenRequests.length;

  await seedClient.diffs.bulkCastVote({ buildId, vote: "approve" });

  await expect.poll(() => latestStateFor(commitSha), { timeout: 60_000 }).toBe("success");
  const after = await fakeGithub.requests();
  expect(after.tokenRequests.length).toBeGreaterThan(mintedBefore);
  expect(after.statuses.at(-1)?.token).not.toBe(statuses.at(-1)?.token);
});

test("test connection explains a repository the app lost access to", async ({
  page,
  seedClient,
}) => {
  const { projectId } = await seedClient.projects.add({
    projectName: `E2E GitHub App access ${Date.now()}`,
    projectDescription: "Project used by the GitHub App E2E test",
    gitMainBranch: "main",
  });
  await seedClient.gitIntegrations.upsert({
    projectId,
    provider: "github",
    authType: "github_app",
    installationId: 4242,
    repositoryId: REPOSITORY.id,
  });

  const settingsPage = new GitIntegrationSettingsPage(page);
  await settingsPage.goto(projectId);
  await fakeGithub.failNext("POST", "/app/installations/4242/access_tokens", 422);
  await settingsPage.testConnectionButton().click();

  await expect(
    settingsPage.toast(
      `the github app can't write commit statuses to ${REPOSITORY.fullName}, check the installation's repositories and permissions`,
    ),
  ).toBeVisible();
});
