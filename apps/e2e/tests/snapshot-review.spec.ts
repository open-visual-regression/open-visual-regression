import { getBaseURL, TEST_ADMIN } from "./constants";
import { expect, test } from "./fixtures";
import { createSeedClient } from "./seed/client";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

// Seeding runs two full Storybook ingests, so allow ample time.
const REVIEW_TIMEOUT_MS = 20 * 60 * 1000;

test.describe("Snapshot review", () => {
  test.describe.configure({ timeout: REVIEW_TIMEOUT_MS });

  test("should review and approve an individual snapshot", async ({
    context,
    snapshotReviewPage,
    seed,
  }) => {
    const cookieHeader = (await context.cookies())
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const client = createSeedClient(getBaseURL(), cookieHeader);

    const reviewable = await seedReviewableSnapshot({
      client,
      projectId: seed.projectId,
      apiKey: seed.apiKey,
    });

    await snapshotReviewPage.goto(seed.projectId, reviewable.buildId, reviewable.snapshotId);

    await expect(snapshotReviewPage.heading()).toHaveText(
      `${reviewable.targetTitle} ${reviewable.targetName}`,
    );
    await expect(snapshotReviewPage.statusBadge("needs review")).toBeVisible();

    await expect(snapshotReviewPage.baselineLabel()).toBeVisible();
    await expect(snapshotReviewPage.newLabel()).toBeVisible();
    await expect(snapshotReviewPage.baselineImage()).toBeVisible();
    await expect(snapshotReviewPage.diffOverlay()).toBeVisible();

    await expect(snapshotReviewPage.showDiffSwitch()).toBeChecked();
    await snapshotReviewPage.showDiffSwitch().click();
    await expect(snapshotReviewPage.showDiffSwitch()).not.toBeChecked();

    await snapshotReviewPage.expandSidebar();
    await expect(snapshotReviewPage.emptyReviews()).toBeVisible();

    await snapshotReviewPage.approve();
    await expect(snapshotReviewPage.approvedButton()).toBeVisible();
    await expect(snapshotReviewPage.approvedButton()).toBeDisabled();
    await expect(snapshotReviewPage.reviewsSummary()).toHaveText("1 of 1 required approvals");
    await expect(snapshotReviewPage.reviewer(TEST_ADMIN.name)).toBeVisible();
  });
});
