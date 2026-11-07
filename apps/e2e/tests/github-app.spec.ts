import { expect, test } from "./fixtures";
import { ingestStorybook } from "./support/ingest";

const FEATURE_BRANCH = "feature/e2e-github-app";

const LIST_LIMIT = 100;

test.describe("GitHub App", () => {
  test("should connect a project to the GitHub App from its settings", async ({
    seedClient,
    gitIntegrationSettingsPage,
    fakeGitHub,
  }) => {
    const { projectId } = await seedClient.projects.add({
      projectName: `E2E GitHub App settings ${Date.now()}`,
      projectDescription: "Project used by the GitHub App settings E2E test",
      gitMainBranch: "main",
    });

    await gitIntegrationSettingsPage.goto(projectId);
    await gitIntegrationSettingsPage.repositoryField().fill("acme/web");
    await gitIntegrationSettingsPage.authenticationSelect().click();
    await gitIntegrationSettingsPage.authenticationOption("github app").click();
    await expect(gitIntegrationSettingsPage.tokenField()).toBeHidden();
    await gitIntegrationSettingsPage.saveButton().click();
    await expect(gitIntegrationSettingsPage.toast("git integration saved")).toBeVisible();

    await gitIntegrationSettingsPage.testConnectionButton().click();
    await expect(gitIntegrationSettingsPage.toast("connection ok")).toBeVisible();

    await fakeGitHub.setInstallation({ installedOn: "someone-else" });
    await gitIntegrationSettingsPage.testConnectionButton().click();
    await expect(
      gitIntegrationSettingsPage.toast("the GitHub App is not installed on acme/web"),
    ).toBeVisible();
  });

  test("should publish a build's status as the App and update it after a review", async ({
    seedClient,
    buildPage,
    fakeGitHub,
  }) => {
    const projectName = `E2E GitHub App statuses ${Date.now()}`;
    const { projectId } = await seedClient.projects.add({
      projectName,
      projectDescription: "Project used by the GitHub App statuses E2E test",
      gitMainBranch: "main",
    });
    const { key } = await seedClient.apiKeys.create({ projectId, name: "e2e-github-app" });
    await seedClient.gitIntegrations.upsert({
      projectId,
      provider: "github",
      repoIdentifier: "acme/web",
      authType: "github_app",
    });

    const build = await ingestStorybook({ apiKey: key, branch: FEATURE_BRANCH });
    const { builds } = await seedClient.builds.list({ projectIds: [projectId], limit: LIST_LIMIT });
    const buildId = builds.find((candidate) => candidate.commitSha === build.commitSha)!.id;

    await expect
      .poll(async () => (await fakeGitHub.statuses(build.commitSha)).at(-1))
      .toMatchObject({
        repo: "acme/web",
        context: `Open Visual Regression / ${projectName}`,
        state: "failure",
        description: "visual changes need review",
        token: expect.stringMatching(/^ghs_/),
        accepted: true,
      });

    await buildPage.goto(projectId, buildId);
    await buildPage.approveAllButton().click();
    await expect(buildPage.approvedButton()).toBeVisible();

    await expect
      .poll(async () => (await fakeGitHub.statuses(build.commitSha)).at(-1))
      .toMatchObject({ state: "success", description: "visual changes approved", accepted: true });
  });

  test("should mint a fresh token when GitHub rejects the cached one", async ({
    seedClient,
    fakeGitHub,
  }) => {
    const { projectId } = await seedClient.projects.add({
      projectName: `E2E GitHub App token refresh ${Date.now()}`,
      projectDescription: "Project used by the GitHub App token refresh E2E test",
      gitMainBranch: "main",
    });
    const { key } = await seedClient.apiKeys.create({ projectId, name: "e2e-github-app" });
    await seedClient.gitIntegrations.upsert({
      projectId,
      provider: "github",
      repoIdentifier: "acme/web",
      authType: "github_app",
    });

    const first = await ingestStorybook({ apiKey: key, branch: FEATURE_BRANCH });
    await expect
      .poll(async () => (await fakeGitHub.statuses(first.commitSha)).at(-1)?.accepted)
      .toBe(true);

    await fakeGitHub.revokeTokens();
    const second = await ingestStorybook({ apiKey: key, branch: FEATURE_BRANCH });

    await expect
      .poll(async () => (await fakeGitHub.statuses(second.commitSha)).at(-1)?.accepted)
      .toBe(true);
    const [rejected, retried] = await fakeGitHub.statuses(second.commitSha);
    expect(rejected).toMatchObject({ accepted: false });
    expect(retried).toMatchObject({ state: rejected!.state, accepted: true });
    expect(retried!.token).not.toBe(rejected!.token);
  });
});
