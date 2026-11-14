import { expect, test } from "./fixtures";

test.describe("Snapshot preferences", () => {
  test("should keep the snapshot sidebar open on the same tab after a reload", async ({
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

    await expect(snapshotReviewPage.collapseSidebarButton()).toBeVisible();
    await expect(snapshotReviewPage.sidebarTab("Logs")).toHaveAttribute("aria-selected", "true");
  });
});
