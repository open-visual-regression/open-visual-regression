import { expect, test } from "./fixtures";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

test.describe("Snapshot preferences", () => {
  test("should keep the snapshot sidebar open on the same tab after a reload", async ({
    page,
    seedClient,
    snapshotReviewPage,
  }) => {
    const { projectId, buildId, snapshotId } = await seedReviewableSnapshot(seedClient);

    await snapshotReviewPage.goto(projectId, buildId, snapshotId);
    await snapshotReviewPage.expandSidebar();
    await snapshotReviewPage.sidebarTab("Logs").click();
    await expect(snapshotReviewPage.sidebarTab("Logs")).toHaveAttribute("aria-selected", "true");

    await page.reload();

    await expect(snapshotReviewPage.collapseSidebarButton()).toBeVisible();
    await expect(snapshotReviewPage.sidebarTab("Logs")).toHaveAttribute("aria-selected", "true");
  });
});
