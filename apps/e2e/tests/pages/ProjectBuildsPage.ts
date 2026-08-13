import type { Locator, Page } from "@playwright/test";

export class ProjectBuildsPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}`);
  }

  // The whole build row is a single link, so there's nothing to find "the row"
  // that isn't already inside "the link" — this locator serves as both.
  buildRow(shortSha: string): Locator {
    return this.page.getByRole("link", {
      name: new RegExp(shortSha, "i"),
    });
  }
}
