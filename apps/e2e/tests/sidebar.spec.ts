import { expect, test } from "./fixtures";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

test.describe("Sidebar", () => {
  test("should stay in place when moving between projects and builds", async ({
    seedClient,
    sidebar,
    page,
  }) => {
    await seedReviewableSnapshot(seedClient);

    await page.goto("/projects");
    await expect(sidebar.recentBuildsLink()).toBeVisible();
    const mounted = await sidebar.root().elementHandle();

    await sidebar.recentBuildsLink().click();
    await page.waitForURL(/\/builds$/);
    await sidebar.projectsLink().click();
    await page.waitForURL(/\/projects$/);

    expect(await mounted?.evaluate((element) => element.isConnected)).toBe(true);
  });
});
