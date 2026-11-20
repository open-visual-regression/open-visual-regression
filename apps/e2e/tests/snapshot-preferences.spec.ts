import { expect, test } from "./fixtures";

test.describe("Snapshot preferences", () => {
  test("should reset the snapshot sidebar after a reload", async ({
    page,
    seed,
    snapshotReviewPage,
  }) => {
    const { projectId, buildId, snapshotId } = seed.reviewable;

    await snapshotReviewPage.goto(projectId, buildId, snapshotId);
    await snapshotReviewPage.expandSidebar();
    await snapshotReviewPage.sidebarTab("Logs").click();
    await expect(snapshotReviewPage.sidebarTab("Logs")).toHaveAttribute("aria-selected", "true");

    await page.reload();

    await expect(snapshotReviewPage.expandSidebarButton()).toBeVisible();
    await snapshotReviewPage.expandSidebar();
    await expect(snapshotReviewPage.sidebarTab("Reviews")).toHaveAttribute("aria-selected", "true");
  });
});
