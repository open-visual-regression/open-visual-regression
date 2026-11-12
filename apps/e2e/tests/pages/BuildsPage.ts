import type { Locator, Page } from "@playwright/test";

export class BuildsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/builds");
  }

  // The router keeps other renders of the page mounted but hidden.
  list(): Locator {
    return this.page
      .locator('[data-scroll-restoration-id="builds-list"]')
      .filter({ visible: true });
  }

  buildRow(projectId: string, buildId: string): Locator {
    return this.list().locator(`a[href="/projects/${projectId}/builds/${buildId}"]`);
  }

  scrollOffset(): Promise<number> {
    return this.list().evaluate((element) => element.scrollTop);
  }

  async scrollDown(deltaY: number) {
    const box = await this.list().boundingBox();
    if (!box) {
      throw new Error("builds list is not visible");
    }
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.wheel(0, deltaY);
    await this.page.waitForTimeout(500);
  }
}
