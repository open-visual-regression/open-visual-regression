import { expect, test } from "./fixtures";

test("build page reflects live status without a manual reload", async ({
  buildPage,
  seed,
  seedClient,
  ingestBuild,
}) => {
  const commitSha = "c0ffee".padEnd(40, "0");
  ingestBuild({ apiKey: seed.apiKey, commitSha });

  const findBuildId = async () => {
    const { builds } = await seedClient.builds.list({ projectIds: [seed.projectId] });
    return builds.find((build) => build.commitSha === commitSha)?.id ?? null;
  };
  await expect.poll(findBuildId, { timeout: 60_000, intervals: [500] }).not.toBeNull();
  const buildId = await findBuildId();

  await buildPage.goto(seed.projectId, buildId ?? "");

  await expect(buildPage.status()).toHaveText(/queued|processing/);
  await expect(buildPage.cancelButton()).toBeVisible();

  await expect(buildPage.status()).toHaveText("unchanged", { timeout: 120_000 });
  await expect(buildPage.cancelButton()).toBeHidden();
  await expect(buildPage.snapshotProgress()).toBeVisible();
  await expect(buildPage.snapshots().first()).toBeVisible();
});
