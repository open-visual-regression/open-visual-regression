import type { Locator, Page } from "@playwright/test";

export class OverviewPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "overview", level: 1 });
  }

  link(name: "projects" | "builds" | "snapshots"): Locator {
    return this.page.getByRole("main").getByRole("link", { name, exact: true });
  }
}
