import type { Locator, Page } from "@playwright/test";

export class OverviewPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "Overview", level: 1 });
  }

  link(name: "Projects" | "Builds" | "Snapshots"): Locator {
    return this.page.getByRole("main").getByRole("link", { name, exact: true });
  }
}
