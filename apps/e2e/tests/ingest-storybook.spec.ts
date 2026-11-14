import { randomBytes } from "node:crypto";

import { expect, test } from "./fixtures";
import { ingestStorybook } from "./support/ingest";

test.describe("Storybook ingestion", () => {
  test("should ingest a Storybook build on the main branch via the CLI and show it finish live", async ({
    buildPage,
    projectBuildsPage,
    seed,
    seedClient,
  }) => {
    const commitSha = randomBytes(20).toString("hex");
    const ingest = ingestStorybook({ apiKey: seed.apiKey, branch: "main", commitSha });

    const findBuildId = async () => {
      const { builds } = await seedClient.builds.list({ projectIds: [seed.projectId] });
      return builds.find((build) => build.commitSha === commitSha)?.id ?? null;
    };
    await expect.poll(findBuildId, { timeout: 60_000, intervals: [500] }).not.toBeNull();

    // The page picks up each status change without a reload.
    await buildPage.goto(seed.projectId, (await findBuildId())!);
    await expect(buildPage.status()).toHaveText(/queued|processing/);
    await expect(buildPage.cancelButton()).toBeVisible();
    // The main branch promotes baselines, so the build passes without review:
    // "auto approved" until baselines exist for these stories, then "unchanged".
    await expect(buildPage.status()).toHaveText(/^(auto approved|unchanged)$/, {
      timeout: 120_000,
    });
    await expect(buildPage.cancelButton()).toBeHidden();

    const { shortSha, stdout, exitCode, stderr } = await ingest;
    expect(exitCode, stderr).toBe(0);
    expect(stdout).toMatch(/Build published: https?:\/\/\S+/);
    expect(stdout).toContain("Build passed.");

    await projectBuildsPage.goto(seed.projectId);
    const row = projectBuildsPage.buildRow(shortSha);
    await expect(row).toBeVisible();
    await expect(row.getByText(/^(auto approved|unchanged)$/)).toBeVisible();
  });

  test("should print the build page URL and exit without waiting for processing", async ({
    page,
    seed,
  }) => {
    const { stdout, exitCode, stderr } = await ingestStorybook({
      apiKey: seed.apiKey,
      branch: "main",
      wait: false,
    });

    expect(exitCode, stderr).toBe(0);
    expect(stdout).not.toContain("Build passed.");

    const buildUrl = stdout.match(/Build published: (\S+)/)?.[1];
    expect(buildUrl, stdout).toBeDefined();

    await page.goto(buildUrl!);
    await expect(page.getByRole("status", { name: "build status" })).toBeVisible();
  });
});
