import { randomBytes } from "node:crypto";

import { E2E_GITHUB } from "../../mock-git-providers/github";
import { expect, test } from "../fixtures";
import { ingestStorybook } from "../support/ingest";

const REPOSITORY = E2E_GITHUB.linkedRepository;

test("settings show the github app's connections", async ({
  integrationsSettingsPage,
  gitProviderMock: _,
}) => {
  await integrationsSettingsPage.goto();

  const section = integrationsSettingsPage.providerSection("github github app");
  await expect(section.getByText(E2E_GITHUB.app.slug, { exact: true })).toBeVisible();
  await expect(section.getByText("connected", { exact: true })).toBeVisible();
  await expect(
    integrationsSettingsPage.connection(section, E2E_GITHUB.installation.account.login),
  ).toContainText("2 repositories");
});

test("a project linked through the github app posts commit statuses", async ({
  connectedProject,
  gitIntegrationSettingsPage,
  gitProviderMock,
  seedClient,
}) => {
  const statusesFor = async (sha: string) =>
    (await gitProviderMock.requests()).statuses.filter((status) => status.sha === sha);
  const latestStateFor = async (sha: string) => (await statusesFor(sha)).at(-1)?.state ?? null;

  await gitIntegrationSettingsPage.goto(connectedProject.projectId);
  await expect(gitIntegrationSettingsPage.authenticationSelect()).toContainText("github app");
  await gitIntegrationSettingsPage.chooseRepository(REPOSITORY.fullName);
  await gitIntegrationSettingsPage.saveButton().click();
  await expect(gitIntegrationSettingsPage.toast("git integration saved")).toBeVisible();

  await gitIntegrationSettingsPage.testConnectionButton().click();
  await expect(gitIntegrationSettingsPage.toast("connection ok")).toBeVisible();

  // A feature-branch build on a project with no baselines needs review.
  const commitSha = randomBytes(20).toString("hex");
  await ingestStorybook({
    apiKey: connectedProject.apiKey,
    branch: "feature/github-app",
    commitSha,
  });
  await expect.poll(() => latestStateFor(commitSha), { timeout: 120_000 }).toBe("failure");

  const { builds } = await seedClient.builds.list({ projectIds: [connectedProject.projectId] });
  const buildId = builds.find((build) => build.commitSha === commitSha)?.id;
  if (!buildId) {
    throw new Error(`Could not find the ingested build for commit ${commitSha}`);
  }

  const statuses = await statusesFor(commitSha);
  expect(statuses[0]).toMatchObject({ repository: REPOSITORY.fullName, state: "pending" });
  expect(statuses.at(-1)).toMatchObject({
    repository: REPOSITORY.fullName,
    state: "failure",
    description: "visual changes need review",
    context: `Open Visual Regression / ${connectedProject.projectName}`,
  });
  expect(statuses.at(-1)?.target_url).toMatch(
    new RegExp(`/projects/${connectedProject.projectId}/builds/${buildId}$`),
  );

  // Every status token was scoped to the linked repository.
  const { tokenRequests } = await gitProviderMock.requests();
  const statusTokens = tokenRequests.filter((request) => request.permissions?.statuses);
  expect(statusTokens.length).toBeGreaterThan(0);
  for (const request of statusTokens) {
    expect(request).toEqual({
      installationId: E2E_GITHUB.installation.id,
      repository_ids: [REPOSITORY.id],
      permissions: { statuses: "write", metadata: "read" },
    });
  }

  // A token the provider rejects is replaced and the status is sent again.
  await gitProviderMock.failNext({
    method: "POST",
    path: `/repos/${REPOSITORY.fullName}/statuses/${commitSha}`,
    status: 401,
  });
  await seedClient.diffs.bulkCastVote({ buildId, vote: "approve" });

  await expect.poll(() => latestStateFor(commitSha), { timeout: 60_000 }).toBe("success");
  const after = await gitProviderMock.requests();
  expect(after.tokenRequests.length).toBeGreaterThan(tokenRequests.length);
  expect(after.statuses.at(-1)?.token).not.toBe(statuses.at(-1)?.token);
});

test("test connection explains a repository the app lost access to", async ({
  connectedProject,
  gitIntegrationSettingsPage,
  gitProviderMock,
  seedClient,
}) => {
  await seedClient.gitIntegrations.upsert({
    projectId: connectedProject.projectId,
    provider: "github",
    credential: {
      type: "connection",
      connectionId: String(E2E_GITHUB.installation.id),
      repositoryId: String(REPOSITORY.id),
    },
  });

  await gitIntegrationSettingsPage.goto(connectedProject.projectId);
  await gitProviderMock.failNext({
    method: "POST",
    path: `/app/installations/${E2E_GITHUB.installation.id}/access_tokens`,
    status: 422,
  });
  await gitIntegrationSettingsPage.testConnectionButton().click();

  await expect(
    gitIntegrationSettingsPage.toast(
      `the github app can't write commit statuses to ${REPOSITORY.fullName}, check the installation's repositories and permissions`,
    ),
  ).toBeVisible();
});
