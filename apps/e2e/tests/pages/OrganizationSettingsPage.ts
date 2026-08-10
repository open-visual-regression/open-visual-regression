import type { Locator, Page } from "@playwright/test";

export class OrganizationSettingsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/settings/organization");
  }

  nameField(): Locator {
    return this.page.getByLabel("name", { exact: true });
  }

  saveButton(): Locator {
    return this.page.getByRole("button", { name: /save changes/i });
  }

  successToast(): Locator {
    return this.page.getByText("organization updated");
  }
}
