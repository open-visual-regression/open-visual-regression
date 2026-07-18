import { expect, test } from "./fixtures";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

const REVIEW_TIMEOUT_MS = 15 * 60 * 1000;

test.describe("Snapshot review", () => {
  test.describe.configure({ timeout: REVIEW_TIMEOUT_MS });

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
