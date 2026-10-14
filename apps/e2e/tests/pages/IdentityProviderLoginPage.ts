import type { Locator, Page } from "@playwright/test";

export class IdentityProviderLoginPage {
  constructor(private readonly page: Page) {}

  usernameField(): Locator {
    return this.page.getByLabel("Username or email");
  }

  passwordField(): Locator {
    return this.page.getByLabel("Password", { exact: true });
  }

  signInButton(): Locator {
    return this.page.getByRole("button", { name: "Sign In" });
  }

  async signIn(username: string, password: string) {
    await this.usernameField().fill(username);
    await this.passwordField().fill(password);
    await this.signInButton().click();
  }
}
