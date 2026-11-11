import { expect, test } from "./fixtures";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

test.describe("Snapshot preferences", () => {
  test("should keep the snapshot sidebar open after a reload", async ({
    page,
    seedClient,
    snapshotReviewPage,
  }) => {
    const { projectId, buildId, snapshotId } = await seedReviewableSnapshot(seedClient);

    await snapshotReviewPage.goto(projectId, buildId, snapshotId);
    await snapshotReviewPage.expandSidebar();
    await expect(snapshotReviewPage.reviewsTab()).toBeVisible();

    await page.reload();

    await expect(snapshotReviewPage.reviewsTab()).toBeVisible();
    await expect(snapshotReviewPage.collapseSidebarButton()).toBeVisible();
  });
});
