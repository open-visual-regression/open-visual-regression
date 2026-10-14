import type { Locator, Page } from "@playwright/test";

export class ForbiddenPage {
  constructor(private readonly page: Page) {}

  heading(): Locator {
    return this.page.getByRole("heading", { name: "you don't have access" });
  }

  requestAccessLink(): Locator {
    return this.page.getByRole("button", { name: /request access/i });
  }
}
