import type { Locator, Page } from "@playwright/test";

export class SnapshotReviewPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: string, buildId: string, snapshotId: string) {
    await this.page.goto(`/projects/${projectId}/builds/${buildId}/snapshots/${snapshotId}`);
  }

  heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  statusBadge(label: string): Locator {
    return this.page.getByText(label, { exact: true });
  }

  baselineLabel(): Locator {
    return this.page.getByText("baseline", { exact: true });
  }

  newLabel(): Locator {
    return this.page.getByText("new", { exact: true });
  }

  baselineImage(): Locator {
    return this.page.getByRole("img", { name: /^baseline snapshot of/i });
  }

  diffOverlay(): Locator {
    return this.page.getByRole("img", { name: /^diff overlay of/i });
  }

  showDiffSwitch(): Locator {
    return this.page.getByRole("switch");
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

  async approve() {
    await this.approveButton().click();
  }

  async expandSidebar() {
    await this.page.getByRole("button", { name: "Expand sidebar" }).click();
  }

  private sidebar(): Locator {
    return this.page.getByRole("complementary");
  }

  emptyReviews(): Locator {
    return this.sidebar().getByText("no reviews yet");
  }

  reviewsSummary(): Locator {
    return this.sidebar().getByText(/\d+ of \d+ required approvals/);
  }

  reviewer(name: string): Locator {
    return this.sidebar().getByText(name);
  }
}
