import { getBaseURL, TEST_ADMIN } from "./constants";
import { expect, test } from "./fixtures";
import { createSeedClient } from "./seed/client";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

// Seeding runs two full ingests (a main baseline plus a feature-branch
// candidate), each of which captures the whole Storybook, so allow ample time.
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

    // The header identifies the snapshot and shows it awaiting review.
    await expect(snapshotReviewPage.heading()).toHaveText(
      `${reviewable.targetTitle} ${reviewable.targetName}`,
    );
    await expect(snapshotReviewPage.statusBadge("needs review")).toBeVisible();

    // The comparison view shows baseline vs new with the generated diff overlay.
    await expect(snapshotReviewPage.baselineLabel()).toBeVisible();
    await expect(snapshotReviewPage.newLabel()).toBeVisible();
    await expect(snapshotReviewPage.baselineImage()).toBeVisible();
    await expect(snapshotReviewPage.diffOverlay()).toBeVisible();

    // The diff overlay is shown by default and can be toggled off.
    await expect(snapshotReviewPage.showDiffSwitch()).toBeChecked();
    await snapshotReviewPage.showDiffSwitch().click();
    await expect(snapshotReviewPage.showDiffSwitch()).not.toBeChecked();

    // The reviews sidebar starts empty.
    await snapshotReviewPage.expandSidebar();
    await expect(snapshotReviewPage.emptyReviews()).toBeVisible();

    // Approving records the review and reflects it across the page.
    await snapshotReviewPage.approve();
    await expect(snapshotReviewPage.approvedButton()).toBeVisible();
    await expect(snapshotReviewPage.approvedButton()).toBeDisabled();
    await expect(snapshotReviewPage.reviewsSummary()).toHaveText("1 of 1 required approvals");
    await expect(snapshotReviewPage.reviewer(TEST_ADMIN.name)).toBeVisible();
  });
});
