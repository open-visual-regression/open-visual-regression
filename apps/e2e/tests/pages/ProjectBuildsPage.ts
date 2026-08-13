import type { Locator, Page } from "@playwright/test";

export class ProjectBuildsPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}`);
  }

  buildRow(shortSha: string): Locator {
    return this.page.getByRole("link", {
      name: new RegExp(shortSha, "i"),
    });
  }
}
