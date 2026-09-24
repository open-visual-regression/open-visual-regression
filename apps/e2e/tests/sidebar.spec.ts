import type { Page } from "@playwright/test";

import type { SeedData } from "./constants";
import { expect, test } from "./fixtures";
import type { AppSidebar } from "./pages/AppSidebar";
import type { SeedClient } from "./seed/client";
import { ingestStorybook } from "./support/ingest";

const NAVIGATION_DELAY_MS = 1_500;

// The sidebar only links to /builds once a build exists.
const seedSidebar = async (seedClient: SeedClient, seed: SeedData) => {
  const { project } = await seedClient.projects.getOne({ projectId: seed.projectId });
  const list = () => seedClient.builds.list({ projectIds: [seed.projectId], limit: 1 });

  let { builds } = await list();
  let ingestOutput = "";
  if (builds.length === 0) {
    const ingest = await ingestStorybook({
      apiKey: seed.apiKey,
      branch: "e2e/sidebar",
      wait: false,
    });
    ingestOutput = ingest.stderr || ingest.stdout;
    ({ builds } = await list());
  }
  const [build] = builds;
  if (!build) {
    throw new Error(`Could not seed a build for the sidebar: ${ingestOutput}`);
  }

  return { project, build };
};

const expectPageLoaded = async (page: Page, sidebar: AppSidebar, url: RegExp) => {
  await page.waitForURL(url);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
  await expect(sidebar.link("recent builds")).toBeVisible();
  expect(await sidebar.violations()).toEqual([]);
};

test.describe("Sidebar", () => {
  test("should only ever show the sidebar in the sidebar while navigating between its pages", async ({
    page,
    seed,
    seedClient,
    sidebar,
  }) => {
    const { project, build } = await seedSidebar(seedClient, seed);
    const projectUrl = new RegExp(`/projects/${project.id}$`);
    const buildUrl = new RegExp(`/projects/${project.id}/builds/${build.id}$`);

    await page.goto("/projects");
    await expectPageLoaded(page, sidebar, /\/projects$/);
    await sidebar.slowNavigations(NAVIGATION_DELAY_MS);

    await sidebar.link("recent builds").click();
    await expectPageLoaded(page, sidebar, /\/builds$/);

    await sidebar.linkTo(`/projects/${project.id}`).click();
    await expectPageLoaded(page, sidebar, projectUrl);

    await sidebar.link("recent builds").click();
    await expectPageLoaded(page, sidebar, /\/builds$/);

    await sidebar.linkTo(`/projects/${project.id}/builds/${build.id}`).click();
    await expectPageLoaded(page, sidebar, buildUrl);

    await sidebar.link("recent builds").click();
    await expectPageLoaded(page, sidebar, /\/builds$/);

    await sidebar.link(/^projects/).click();
    await expectPageLoaded(page, sidebar, /\/projects$/);
  });

  test("should show the sidebar's own skeleton when entering from settings", async ({
    page,
    seed,
    seedClient,
    sidebar,
  }) => {
    await seedSidebar(seedClient, seed);

    await page.goto("/builds");
    await expectPageLoaded(page, sidebar, /\/builds$/);
    await page.getByRole("button", { name: /user menu/i }).click();
    await page.getByRole("menuitem", { name: /settings/i }).click();
    await page.waitForURL(/\/settings\//);

    await page.goBack();
    await expectPageLoaded(page, sidebar, /\/builds$/);

    await page.goForward();
    await page.waitForURL(/\/settings\//);
    await sidebar.slowNavigations(NAVIGATION_DELAY_MS);
    await page.getByRole("link", { name: "ovr" }).click();
    await expectPageLoaded(page, sidebar, /\/projects$/);
  });

  test("should show the sidebar's own skeleton on a hard load", async ({
    page,
    seed,
    seedClient,
    sidebar,
  }) => {
    const { project } = await seedSidebar(seedClient, seed);

    for (const [path, url] of [
      ["/builds", /\/builds$/],
      ["/projects", /\/projects$/],
      [`/projects/${project.id}`, new RegExp(`/projects/${project.id}$`)],
    ] as const) {
      await page.goto(path);
      await expectPageLoaded(page, sidebar, url);
    }
  });
});
