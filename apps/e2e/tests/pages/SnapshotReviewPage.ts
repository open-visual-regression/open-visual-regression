import type { Locator, Page } from "@playwright/test";

export class SnapshotReviewPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: string, buildId: string, snapshotId: string) {
    await this.page.goto(`/projects/${projectId}/builds/${buildId}/snapshots/${snapshotId}`);
  }

  approveButton(): Locator {
    return this.page.getByRole("button", { name: "approve", exact: true });
  }

  approvedButton(): Locator {
    return this.page.getByRole("button", { name: "approved", exact: true });
  }

  rejectButton(): Locator {
    return this.page.getByRole("button", { name: "reject", exact: true });
  }

  rejectedButton(): Locator {
    return this.page.getByRole("button", { name: "rejected", exact: true });
  }

  async expandSidebar() {
    await this.page.getByRole("button", { name: "Expand sidebar" }).click();
  }

  private sidebar(): Locator {
    return this.page.getByRole("complementary");
  }

  async removeReview() {
    await this.sidebar().getByRole("button", { name: "remove your review" }).click();
  }

  emptyReviews(): Locator {
    return this.sidebar().getByText("no reviews yet");
  }
}
