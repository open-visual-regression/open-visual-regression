import { expect, test } from "./fixtures";
import { ingestStorybook } from "./support/ingest";

test.describe("Overview", () => {
  test("should link to the projects, builds, and snapshots pages", async ({
    overviewPage,
    page,
  }) => {
    for (const [name, path] of [
      ["projects", /\/projects$/],
      ["builds", /\/builds$/],
      ["snapshots", /\/snapshots$/],
    ] as const) {
      await overviewPage.goto();
      await expect(overviewPage.heading()).toBeVisible();

      await overviewPage.link(name).click();

      await expect(page).toHaveURL(path);
      await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
    }
  });

  test("should list a project's baseline snapshots and open one", async ({
    seedClient,
    overviewPage,
    snapshotsPage,
    page,
  }) => {
    const projectName = `E2E Baselines ${Date.now()}`;
    const { projectId } = await seedClient.projects.add({
      projectName,
      projectDescription: "Project used by the snapshots E2E test",
      gitMainBranch: "main",
    });
    const { key } = await seedClient.apiKeys.create({ projectId, name: "e2e-baselines" });
    const build = await ingestStorybook({ apiKey: key, branch: "main" });
    expect(build.exitCode, build.stderr).toBe(0);

    await overviewPage.goto();
    await overviewPage.link("snapshots").click();
    await expect(snapshotsPage.heading()).toBeVisible();

    await snapshotsPage.filterBy("project", projectName);

    await expect(page).toHaveURL(new RegExp(`project=${projectId}`));
    await expect(snapshotsPage.facetTrigger("project")).toHaveAccessibleName(
      new RegExp(projectName),
    );
    await expect(snapshotsPage.cardsForProject(projectName).first()).toBeVisible();
    await expect(snapshotsPage.cardsNotForProject(projectName)).toHaveCount(0);

    await snapshotsPage.cardsForProject(projectName).first().click();

    await expect(page).toHaveURL(
      new RegExp(`/projects/${projectId}/builds/[^/]+/snapshots/[^/]+$`),
    );
  });
});
