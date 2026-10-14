import type { Locator, Page } from "@playwright/test";

export class ForbiddenPage {
  constructor(private readonly page: Page) {}

  heading(): Locator {
    return this.page.getByRole("heading", { name: "Forbidden" });
  }
}
