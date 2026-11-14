import { randomBytes } from "node:crypto";

import { getBaseURL } from "./constants";
import { expect, test } from "./fixtures";
import { createTokenClient } from "./seed/client";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

test.describe("Scroll restoration", () => {
  test("should return the build page to where the user left off after going back", async ({
    seed,
    buildPage,
    page,
  }) => {
    const { projectId, buildId } = seed.reviewable;

    await buildPage.goto(projectId, buildId);
    await expect(buildPage.snapshotCards().first()).toBeVisible();

    await buildPage.scrollDown(500);
    const scrolled = await buildPage.scrollOffset();
    expect(scrolled).toBeGreaterThan(0);

    await buildPage.snapshotCards().first().click();
    await page.waitForURL(/\/snapshots\//);

    await page.goBack();
    await expect(buildPage.snapshotCards().first()).toBeVisible();

    await expect
      .poll(() => buildPage.scrollOffset(), { timeout: 10_000 })
      .toBeCloseTo(scrolled, -2);
  });

  test("should keep the builds list where the user left off after approving a build and going back", async ({
    seedClient,
    buildsPage,
    buildPage,
    page,
  }) => {
    const target = await seedReviewableSnapshot(seedClient);
    // Rows to scroll past: they only need to be listed, not captured.
    const uploader = createTokenClient(getBaseURL(), target.apiKey);
    for (const branch of ["feature/scroll-filler-1", "feature/scroll-filler-2"]) {
      await uploader.builds.createBuild({ branch, commitSha: randomBytes(20).toString("hex") });
    }

    // Short enough for a few builds to scroll.
    await page.setViewportSize({ width: 1280, height: 420 });
    await buildsPage.goto();
    const row = buildsPage.buildRow(target.projectId, target.buildId);
    await expect(row).toBeAttached();

    await buildsPage.scrollDown(150);
    const scrolled = await buildsPage.scrollOffset();
    expect(scrolled).toBeGreaterThan(0);

    await row.click();
    await page.waitForURL(`**/builds/${target.buildId}`);

    await buildPage.approveAllButton().click();
    await expect(buildPage.approvedButton()).toBeVisible();

    await page.goBack();
    await expect(row).toBeVisible();

    await expect
      .poll(() => buildsPage.scrollOffset(), { timeout: 10_000 })
      .toBeCloseTo(scrolled, -1);
    await page.waitForTimeout(1_500);
    expect(await buildsPage.scrollOffset()).toBeCloseTo(scrolled, -1);
  });

  test("should show the top of the build page when opening it fresh", async ({
    seed,
    buildPage,
  }) => {
    const { projectId, buildId } = seed.reviewable;

    await buildPage.goto(projectId, buildId);
    await expect(buildPage.snapshotCards().first()).toBeVisible();
    await buildPage.scrollDown(500);
    expect(await buildPage.scrollOffset()).toBeGreaterThan(0);

    await buildPage.goto(projectId, buildId);
    await expect(buildPage.snapshotCards().first()).toBeVisible();

    expect(await buildPage.scrollOffset()).toBe(0);
  });

  test("should leave the user where they scroll to after going back", async ({
    seed,
    buildPage,
    page,
  }) => {
    const { projectId, buildId } = seed.reviewable;

    await buildPage.goto(projectId, buildId);
    await expect(buildPage.snapshotCards().first()).toBeVisible();
    await buildPage.scrollDown(600);
    const scrolled = await buildPage.scrollOffset();

    await buildPage.snapshotCards().first().click();
    await page.waitForURL(/\/snapshots\//);
    await page.goBack();
    await expect(buildPage.snapshotCards().first()).toBeVisible();

    await buildPage.scrollDown(-400);
    const movedTo = await buildPage.scrollOffset();
    expect(movedTo).toBeLessThan(scrolled);

    // Nothing should pull them back to the restored offset afterwards.
    await page.waitForTimeout(1_500);
    expect(await buildPage.scrollOffset()).toBe(movedTo);
  });
});
