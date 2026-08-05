import type { Locator, Page } from "@playwright/test";

export class BuildPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: string, buildId: string) {
    await this.page.goto(`/projects/${projectId}/builds/${buildId}`);
  }

  status(): Locator {
    return this.page.getByRole("status", { name: "build status" });
  }

  cancelButton(): Locator {
    return this.page.getByRole("button", { name: "cancel build", exact: true });
  }

  snapshotCards(): Locator {
    return this.page.getByRole("link", { name: /^snapshot of/i });
  }

  scrollContainer(): Locator {
    return this.page.locator('[data-scroll-restoration-id="projects-main"]');
  }

  scrollOffset(): Promise<number> {
    return this.scrollContainer().evaluate((element) => element.scrollTop);
  }

  // Scrolls with a real wheel gesture: only user-driven scrolling is remembered,
  // so assigning scrollTop would not be recorded.
  async scrollDown(deltaY: number) {
    const box = await this.scrollContainer().boundingBox();
    if (!box) {
      throw new Error("scroll container is not visible");
    }
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.wheel(0, deltaY);
    await this.page.waitForTimeout(500);
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
