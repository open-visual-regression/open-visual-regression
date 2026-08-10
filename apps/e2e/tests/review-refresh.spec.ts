import { expect, test } from "./fixtures";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

test.describe("Review refresh", () => {
  test("should show a snapshot's new status on the build page after reviewing it and going back", async ({
    page,
    buildPage,
    seedClient,
    snapshotReviewPage,
  }) => {
    const reviewable = await seedReviewableSnapshot(seedClient);

    await buildPage.goto(reviewable.projectId, reviewable.buildId);
    await expect(buildPage.snapshotCard(reviewable, "needs review")).toBeVisible();

    await buildPage.snapshotCard(reviewable).click();
    await page.waitForURL(`**/snapshots/${reviewable.snapshotId}`);
    await snapshotReviewPage.approveButton().click();

    await buildPage.backButton().click();
    await page.waitForURL(`**/builds/${reviewable.buildId}`);

    await expect(buildPage.snapshotCard(reviewable, "approved")).toBeVisible();
  });

  test("should update the badge and the cards when rejecting all on a settled build", async ({
    buildPage,
    seedClient,
  }) => {
    const reviewable = await seedReviewableSnapshot(seedClient);

    await buildPage.goto(reviewable.projectId, reviewable.buildId);
    await buildPage.approveAllButton().click();
    await expect(buildPage.approvedButton()).toBeVisible();

    await buildPage.goto(reviewable.projectId, reviewable.buildId);
    await expect(buildPage.status()).toHaveText("approved");

    await buildPage.rejectAllButton().click();

    await expect(buildPage.rejectedButton()).toBeVisible();
    await expect(buildPage.status()).toHaveText("rejected");
    await expect(buildPage.snapshotCard(reviewable, "rejected")).toBeVisible();
  });
});
