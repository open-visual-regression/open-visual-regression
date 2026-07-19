import { spawn } from "node:child_process";
import path from "node:path";

import { getBaseURL } from "./constants";
import { expect, test } from "./fixtures";

const REPO_ROOT = path.resolve(process.cwd(), "../..");
const CLI_ENTRY = path.join(REPO_ROOT, "apps/cli/dist/index.js");
const STORYBOOK_PKG_DIR = path.join(REPO_ROOT, "packages/ui");
const STORYBOOK_DIR = path.join(STORYBOOK_PKG_DIR, "storybook-static");

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
  buildPage,
  seed,
  seedClient,
}) => {
  const commitSha = "c0ffee".padEnd(40, "0");
  const ingest = startIngest(seed.apiKey, commitSha);

  const findBuildId = async () => {
    const { builds } = await seedClient.builds.list({ projectIds: [seed.projectId] });
    return builds.find((build) => build.commitSha === commitSha)?.id ?? null;
  };
  await expect.poll(findBuildId, { timeout: 60_000, intervals: [500] }).not.toBeNull();
  const buildId = await findBuildId();

  await buildPage.goto(seed.projectId, buildId ?? "");

  // The page opens mid-flight.
  await expect(buildPage.status()).toHaveText(/queued|processing/);
  await expect(buildPage.cancelButton()).toBeVisible();

  // Everything below settles in place, without the test ever reloading the page.
  await expect(buildPage.status()).toHaveText("unchanged", { timeout: 120_000 });
  await expect(buildPage.cancelButton()).toBeHidden();
  await expect(buildPage.snapshotProgress()).toBeVisible();
  await expect(buildPage.snapshots().first()).toBeVisible();

  ingest.kill();
});
