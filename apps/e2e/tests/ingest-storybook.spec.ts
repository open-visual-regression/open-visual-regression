import { expect, test } from "./fixtures";
import { ingestStorybook } from "./support/ingest";

const INGEST_TIMEOUT_MS = 15 * 60 * 1000;

test.describe("Storybook ingestion", () => {
  test.describe.configure({ timeout: INGEST_TIMEOUT_MS });

  test("should ingest a Storybook build on the main branch via the CLI and mark it complete", async ({
    projectBuildsPage,
    seed,
  }) => {
    // The main branch promotes baselines, so the build resolves to "unchanged"
    // rather than "needs_review".
    const { shortSha, stdout, exitCode, stderr } = await ingestStorybook({
      apiKey: seed.apiKey,
      branch: "main",
    });

    expect(exitCode, stderr).toBe(0);
    expect(stdout).toContain("Build passed.");

    await projectBuildsPage.goto(seed.projectId);

    const row = projectBuildsPage.buildRow(shortSha);
    await expect(row).toBeVisible();
    await expect(row.getByText("unchanged", { exact: true })).toBeVisible();
  });
});
