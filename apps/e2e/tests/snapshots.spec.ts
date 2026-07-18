import { expect, test } from "./fixtures";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

test.describe("Snapshots", () => {
  test("should approve, reject, and remove a review for a snapshot", async ({
    seedClient,
    snapshotReviewPage,
  }) => {
    const reviewable = await seedReviewableSnapshot(seedClient);

    await snapshotReviewPage.goto(reviewable.projectId, reviewable.buildId, reviewable.snapshotId);

    await snapshotReviewPage.approveButton().click();
    await expect(snapshotReviewPage.approvedButton()).toBeVisible();

    await snapshotReviewPage.rejectButton().click();
    await expect(snapshotReviewPage.rejectedButton()).toBeVisible();

    await snapshotReviewPage.expandSidebar();
    await snapshotReviewPage.removeReview();
    await expect(snapshotReviewPage.emptyReviews()).toBeVisible();
  });
});
