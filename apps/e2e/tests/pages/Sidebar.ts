import type { Locator, Page } from "@playwright/test";

export class Sidebar {
  constructor(private readonly page: Page) {}

  root(): Locator {
    return this.page.getByRole("complementary");
  }

  projectsLink(): Locator {
    return this.root().getByRole("link", { name: /^projects/ });
  }

  recentBuildsLink(): Locator {
    return this.root().getByRole("link", { name: "recent builds", exact: true });
  }
}
