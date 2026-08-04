import type { Locator, Page } from "@playwright/test";

export class BuildPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: string, buildId: string) {
    await this.page.goto(`/projects/${projectId}/builds/${buildId}`);
  }

  status(): Locator {
    // Loading skeletons also render role="status" (aria-label="loading"), and a
    // navigation can still be streaming them in when a test asserts on this.
    return this.page.locator('[role="status"]:not([aria-label="loading"])');
  }

  cancelButton(): Locator {
    return this.page.getByRole("button", { name: "cancel build", exact: true });
  }

  rebuildButton(): Locator {
    return this.page.getByRole("button", { name: "rebuild", exact: true });
  }

  async confirmRebuild() {
    await this.rebuildButton().click();
    await this.page
      .getByRole("alertdialog")
      .getByRole("button", { name: "rebuild", exact: true })
      .click();
  }

  snapshotThumbnails(): Locator {
    return this.page.getByRole("img", { name: /^snapshot of/ });
  }
}
