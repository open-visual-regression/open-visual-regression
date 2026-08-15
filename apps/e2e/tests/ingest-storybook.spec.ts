import { expect, test } from "./fixtures";
import { ingestStorybook } from "./support/ingest";

test.describe("Storybook ingestion", () => {
  test("should ingest a Storybook build on the main branch via the CLI and mark it complete", async ({
    projectBuildsPage,
    seed,
  }) => {
    // The main branch promotes baselines, so the build passes without review:
    // "auto approved" until baselines exist for these stories, then "unchanged".
    const { shortSha, stdout, exitCode, stderr } = await ingestStorybook({
      apiKey: seed.apiKey,
      branch: "main",
    });

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
