import { expect, test } from "./fixtures";
import { ingestStorybook } from "./support/ingest";

test("should rebuild a completed build into a new build with its own real snapshots", async ({
  page,
  buildPage,
  seed,
  seedClient,
}) => {
  const { commitSha, exitCode, stderr, stdout } = await ingestStorybook({
    apiKey: seed.apiKey,
    branch: "main",
  });
  expect(exitCode, stderr).toBe(0);
  expect(stdout).toContain("Build passed.");

  const { builds } = await seedClient.builds.list({ projectIds: [seed.projectId] });
  const sourceBuildId = builds.find((build) => build.commitSha === commitSha)?.id;
  expect(sourceBuildId).toBeDefined();

  const { snapshots: sourceSnapshots, total: sourceTotal } = await seedClient.snapshots.list({
    buildId: sourceBuildId!,
    limit: 100,
  });
  expect(sourceTotal).toBeGreaterThan(0);
  expect(sourceSnapshots.every((snapshot) => snapshot.imagePath)).toBe(true);

  await buildPage.goto(seed.projectId, sourceBuildId!);
  await expect(buildPage.snapshotThumbnails().first()).toBeVisible();
  await expect(buildPage.rebuildButton()).toBeVisible();

  await buildPage.confirmRebuild();

  await page.waitForURL((url) => !url.pathname.endsWith(sourceBuildId!), { timeout: 30_000 });
  const rebuiltBuildId = new URL(page.url()).pathname.split("/builds/")[1]!;
  expect(rebuiltBuildId).not.toBe(sourceBuildId);

  await expect(buildPage.status()).toHaveText(/queued|processing/);
  await expect(buildPage.status()).toHaveText("unchanged", { timeout: 120_000 });

  const { snapshots: rebuiltSnapshots, total: rebuiltTotal } = await seedClient.snapshots.list({
    buildId: rebuiltBuildId,
    limit: 100,
  });
  expect(rebuiltTotal).toBe(sourceTotal);
  expect(rebuiltSnapshots.every((snapshot) => snapshot.imagePath)).toBe(true);

  await expect(buildPage.snapshotThumbnails()).toHaveCount(rebuiltTotal);

  await buildPage.goto(seed.projectId, sourceBuildId!);
  await expect(buildPage.rebuildButton()).toBeHidden();
});
