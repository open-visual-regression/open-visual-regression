import type { Page } from "@playwright/test";

export class SetupPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/setup");
  }

  organizationNameField() {
    return this.page.getByLabel("organization name");
  }

  nextButton() {
    return this.page.getByRole("button", { name: "next", exact: true });
  }

  nameField() {
    return this.page.getByLabel("name", { exact: true });
  }

  emailField() {
    return this.page.getByLabel("email", { exact: true });
  }

  passwordField() {
    return this.page.getByLabel("password", { exact: true });
  }

  confirmPasswordField() {
    return this.page.getByLabel("confirm password");
  }

  createButton() {
    return this.page.getByRole("button", { name: "create" });
  }
}
