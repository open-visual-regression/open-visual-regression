import type { Locator, Page } from "@playwright/test";

export class Sidebar {
  constructor(private readonly page: Page) {}

  root(): Locator {
    return this.page.getByRole("complementary");
  }

  projectsLink(): Locator {
    return this.root().getByRole("link", { name: /^Projects/ });
  }

  recentBuildsLink(): Locator {
    return this.root().getByRole("link", { name: "Recent builds", exact: true });
  }
}
