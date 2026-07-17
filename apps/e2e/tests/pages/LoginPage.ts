import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  emailField() {
    return this.page.getByLabel("email", { exact: true });
  }

  passwordField() {
    return this.page.getByLabel("password", { exact: true });
  }

  signInButton() {
    return this.page.getByRole("button", { name: "sign in" });
  }
}
