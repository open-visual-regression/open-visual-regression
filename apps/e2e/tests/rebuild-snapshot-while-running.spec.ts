import { randomBytes } from "node:crypto";

import { expect, test } from "./fixtures";

const LIST_LIMIT = 100;
const IN_FLIGHT = new Set(["queued", "processing"]);
const NOT_REBUILDABLE = new Set(["queued", "processing", "skipped", "canceled"]);

test("a finished snapshot can be rebuilt while the rest of its build is still running", async ({
  seed,
  seedClient,
  snapshotReviewPage,
  ingestBuild,
}) => {
  const commitSha = randomBytes(20).toString("hex");
  const branch = `feature/rebuild-while-running-${commitSha.slice(0, 7)}`;
  ingestBuild({ apiKey: seed.apiKey, commitSha, branch });

  const findBuild = async () => {
    const { builds } = await seedClient.builds.list({ projectIds: [seed.projectId] });
    return builds.find((build) => build.commitSha === commitSha) ?? null;
  };
  const listSnapshots = async (buildId: string) =>
    (await seedClient.snapshots.list({ buildId, limit: LIST_LIMIT })).snapshots;

  await expect.poll(findBuild, { timeout: 60_000, intervals: [500] }).not.toBeNull();
  const buildId = (await findBuild())!.id;

  // Wait for the moment the issue describes: some snapshots done, others still in flight.
  let finished: { id: string } | undefined;
  let inFlight: { id: string } | undefined;
  await expect
    .poll(
      async () => {
        const snapshots = await listSnapshots(buildId);
        finished = snapshots.find((snapshot) => !NOT_REBUILDABLE.has(snapshot.status));
        // The last queued snapshot is the one least likely to finish before its page loads.
        inFlight = snapshots.filter((snapshot) => snapshot.status === "queued").at(-1);
        return Boolean(finished && inFlight);
      },
      { timeout: 120_000, intervals: [250] },
    )
    .toBe(true);

  await snapshotReviewPage.goto(seed.projectId, buildId, finished!.id);
  await expect(snapshotReviewPage.rebuildButton()).toBeVisible();
  expect(IN_FLIGHT.has((await findBuild())!.status)).toBe(true);

  await snapshotReviewPage.goto(seed.projectId, buildId, inFlight!.id);
  const inFlightNow = (await listSnapshots(buildId)).find((s) => s.id === inFlight!.id);
  // Skip the check if it finished before its page loaded.
  if (inFlightNow && IN_FLIGHT.has(inFlightNow.status)) {
    await expect(snapshotReviewPage.rebuildButton()).toBeHidden();
  }

  const before = (await seedClient.snapshots.getOne({ snapshotId: finished!.id })).snapshot;
  await snapshotReviewPage.goto(seed.projectId, buildId, finished!.id);
  await snapshotReviewPage.confirmRebuild();
  expect(IN_FLIGHT.has((await findBuild())!.status)).toBe(true);

  // The rebuilt snapshot is captured again, and the build only settles once it is.
  await expect
    .poll(async () => (await findBuild())!.status, { timeout: 300_000, intervals: [1000] })
    .not.toMatch(/^(queued|processing)$/);
  const after = (await seedClient.snapshots.getOne({ snapshotId: finished!.id })).snapshot;
  expect(after.imagePath).not.toBeNull();
  expect(after.imagePath).not.toBe(before.imagePath);
  expect(IN_FLIGHT.has(after.status)).toBe(false);
  const leftover = (await listSnapshots(buildId)).filter((s) => IN_FLIGHT.has(s.status));
  expect(leftover).toEqual([]);

  await snapshotReviewPage.goto(seed.projectId, buildId, finished!.id);
  await expect(snapshotReviewPage.rebuildButton()).toBeVisible();
});
