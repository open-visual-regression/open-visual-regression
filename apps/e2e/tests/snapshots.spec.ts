import type { Locator } from "@playwright/test";

import { expect, test } from "./fixtures";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

test.describe("Snapshots", () => {
  test("should approve, reject, and remove a review for a snapshot", async ({
    seedClient,
    snapshotReviewPage,
  }) => {
    const reviewable = await seedReviewableSnapshot(seedClient);
    const goto = () =>
      snapshotReviewPage.goto(reviewable.projectId, reviewable.buildId, reviewable.snapshotId);

    const expectReviewedOnReturn = (button: Locator) =>
      expect(async () => {
        await goto();
        await expect(button).toBeVisible({ timeout: 5_000 });
      }).toPass({ timeout: 30_000 });

    await goto();

    await snapshotReviewPage.approveButton().click();
    await expectReviewedOnReturn(snapshotReviewPage.approvedButton());

    await snapshotReviewPage.rejectButton().click();
    await expectReviewedOnReturn(snapshotReviewPage.rejectedButton());

    await snapshotReviewPage.expandSidebar();
    await snapshotReviewPage.removeReview();
    await expect(snapshotReviewPage.emptyReviews()).toBeVisible();
  });
});
