import type { Page } from "@playwright/test";

export class SetupPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/setup");
  }

  organizationNameField() {
    return this.page.getByLabel("Organization name");
  }

  nextButton() {
    return this.page.getByRole("button", { name: "Next", exact: true });
  }

  nameField() {
    return this.page.getByLabel("Name", { exact: true });
  }

  emailField() {
    return this.page.getByLabel("Email", { exact: true });
  }

  passwordField() {
    return this.page.getByLabel("Password", { exact: true });
  }

  confirmPasswordField() {
    return this.page.getByLabel("Confirm password");
  }

  createButton() {
    return this.page.getByRole("button", { name: "Create" });
  }
}
