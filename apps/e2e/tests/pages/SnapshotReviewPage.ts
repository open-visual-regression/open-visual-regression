import type { Locator, Page } from "@playwright/test";

type SnapshotTarget = {
  targetTitle: string;
  targetName: string;
};

const IMAGE_NAME_PREFIXES = {
  baseline: "baseline ",
  new: "",
  diff: "diff overlay of ",
} as const;

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

  image(
    view: keyof typeof IMAGE_NAME_PREFIXES,
    { targetTitle, targetName }: SnapshotTarget,
  ): Locator {
    return this.page.getByRole("img", {
      name: `${IMAGE_NAME_PREFIXES[view]}snapshot of ${targetTitle} ${targetName}`,
      exact: true,
    });
  }

  imageWidth(image: Locator): Promise<number> {
    return image.evaluate((element: HTMLImageElement) => element.naturalWidth);
  }

  rebuildButton(): Locator {
    return this.page.getByRole("button", { name: "rebuild", exact: true });
  }

  async confirmRebuild() {
    await this.rebuildButton().click();
    await this.page
      .getByRole("alertdialog", { name: "rebuild this snapshot?" })
      .getByRole("button", { name: "rebuild", exact: true })
      .click();
  }

  async expandSidebar() {
    await this.expandSidebarButton().click();
  }

  expandSidebarButton(): Locator {
    return this.page.getByRole("button", { name: "Expand sidebar" });
  }

  collapseSidebarButton(): Locator {
    return this.page.getByRole("button", { name: "Collapse sidebar" });
  }

  sidebarTab(name: "Reviews" | "Logs" | "History"): Locator {
    return this.sidebar().getByRole("tab", { name });
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
