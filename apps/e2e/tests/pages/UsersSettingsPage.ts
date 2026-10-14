import type { Locator, Page } from "@playwright/test";

export class UsersSettingsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/settings/users");
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "users", exact: true });
  }

  inviteButton(): Locator {
    return this.page.getByRole("button", { name: /invite user/i });
  }

  roleButton(name: string): Locator {
    return this.page.getByRole("button", { name: `change role for ${name}` });
  }
}
