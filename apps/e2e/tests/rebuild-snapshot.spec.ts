import { expect, test } from "./fixtures";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

const LIST_LIMIT = 100;

test("rebuilding a snapshot captures it again and leaves the rest of the build alone", async ({
  seedClient,
  snapshotReviewPage,
}) => {
  const reviewable = await seedReviewableSnapshot(seedClient);

  const { snapshot: before } = await seedClient.snapshots.getOne({
    snapshotId: reviewable.snapshotId,
  });
  expect(before.imagePath).not.toBeNull();

  const { snapshots: siblings } = await seedClient.snapshots.list({
    buildId: reviewable.buildId,
    limit: LIST_LIMIT,
  });
  const untouched = siblings.filter((snapshot) => snapshot.id !== reviewable.snapshotId);
  expect(untouched.length).toBeGreaterThan(0);

  await snapshotReviewPage.goto(reviewable.projectId, reviewable.buildId, reviewable.snapshotId);
  await snapshotReviewPage.confirmRebuild();

  await expect(async () => {
    const { snapshot } = await seedClient.snapshots.getOne({
      snapshotId: reviewable.snapshotId,
    });
    expect(snapshot.status).toBe("needs_review");
    expect(snapshot.imagePath).not.toBe(before.imagePath);
  }).toPass({ timeout: 120_000 });

  const { snapshots: after } = await seedClient.snapshots.list({
    buildId: reviewable.buildId,
    limit: LIST_LIMIT,
  });
  expect(after.filter((snapshot) => snapshot.id !== reviewable.snapshotId)).toEqual(untouched);
});
