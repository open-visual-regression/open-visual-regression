import { spawn } from "node:child_process";
import path from "node:path";

import { getBaseURL } from "./constants";
import { expect, test } from "./fixtures";

const REPO_ROOT = path.resolve(process.cwd(), "../..");
const CLI_ENTRY = path.join(REPO_ROOT, "apps/cli/dist/index.js");
const STORYBOOK_PKG_DIR = path.join(REPO_ROOT, "packages/ui");
const STORYBOOK_DIR = path.join(STORYBOOK_PKG_DIR, "storybook-static");

// Kick off the CLI ingest without waiting for it to finish, so the page can be
// opened while the build is still queued/processing.
const startIngest = (apiKey: string, commitSha: string) =>
  spawn(
    "node",
    [
      CLI_ENTRY,
      "snapshot",
      "storybook",
      "--dir",
      STORYBOOK_DIR,
      "--server-url",
      getBaseURL(),
      "--branch",
      "main",
      "--commit",
      commitSha,
      "--name",
      `live status ${commitSha.slice(0, 7)}`,
      "--timeout",
      "600",
    ],
    { cwd: STORYBOOK_PKG_DIR, env: { ...process.env, OVR_API_KEY: apiKey } },
  );

test("build page reflects live status without a manual reload", async ({
  page,
  seed,
  seedClient,
}) => {
  const commitSha = "c0ffee".padEnd(40, "0");
  const ingest = startIngest(seed.apiKey, commitSha);

  // Grab the build id as soon as it exists — well before it settles.
  let buildId: string | undefined;
  await expect
    .poll(
      async () => {
        const { builds } = await seedClient.builds.list({ projectIds: [seed.projectId] });
        buildId = builds.find((build) => build.commitSha === commitSha)?.id;
        return buildId ?? null;
      },
      { timeout: 60_000, intervals: [500] },
    )
    .not.toBeNull();

  await page.goto(`/projects/${seed.projectId}/builds/${buildId}`);
  const statusBadge = page.getByText(/^(queued|processing|unchanged|error)$/).first();

  // The page opens while the build is still running.
  await expect(statusBadge).toHaveText(/queued|processing/);

  // Without ever reloading, the badge settles, the progress summary fills in, and
  // snapshots appear — driven entirely by the live status stream.
  await expect(page.getByText("unchanged", { exact: true })).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(/\d+ snapshots/i)).toBeVisible();
  await expect(page.locator('a[href*="/snapshots/"]').first()).toBeVisible();

  ingest.kill();
});
