import { expect, test } from "./fixtures";

const BRANCH = "feature/supersede";

test("pushing a new commit to a branch cancels the build still running for the old one", async ({
  page,
  buildPage,
  seed,
  seedClient,
  ingestBuild,
}) => {
  const supersededSha = "5uper5eded".padEnd(40, "0");
  const latestSha = "d1d1d1d1".padEnd(40, "0");

  const findBuild = async (commitSha: string) => {
    const { builds } = await seedClient.builds.list({ projectIds: [seed.projectId], limit: 50 });
    return builds.find((build) => build.commitSha === commitSha) ?? null;
  };

  ingestBuild({ apiKey: seed.apiKey, branch: BRANCH, commitSha: supersededSha });

  // Push the second commit as soon as the first build exists, so the race is
  // decided over the API rather than against a page load.
  await expect
    .poll(() => findBuild(supersededSha), { timeout: 60_000, intervals: [250] })
    .not.toBeNull();

  ingestBuild({ apiKey: seed.apiKey, branch: BRANCH, commitSha: latestSha });

  await expect
    .poll(async () => (await findBuild(supersededSha))?.status, { timeout: 120_000 })
    .toBe("canceled");

  const superseded = await findBuild(supersededSha);
  await buildPage.goto(seed.projectId, superseded!.id);

  await expect(buildPage.status()).toHaveText("canceled");
  await expect(page.getByText(/canceled by the system/i)).toBeVisible();
  await expect(buildPage.cancelButton()).toBeHidden();

  // The build that superseded it still runs to completion. Which review status
  // it settles on depends on the project's baselines, so only assert that it
  // finished and was not itself canceled.
  await expect
    .poll(async () => (await findBuild(latestSha))?.status, { timeout: 180_000 })
    .toMatch(/^(unchanged|auto_approved|needs_review)$/);
});
