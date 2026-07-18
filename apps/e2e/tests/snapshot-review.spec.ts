import { getBaseURL } from "./constants";
import { expect, test } from "./fixtures";
import { createSeedClient } from "./seed/client";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

const REVIEW_TIMEOUT_MS = 15 * 60 * 1000;

test.describe("Snapshot review", () => {
  test.describe.configure({ timeout: REVIEW_TIMEOUT_MS });

  test("should approve, reject, and remove a review for a snapshot", async ({
    context,
    snapshotReviewPage,
  }) => {
    const cookieHeader = (await context.cookies())
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const client = createSeedClient(getBaseURL(), cookieHeader);

    const reviewable = await seedReviewableSnapshot(client);

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
