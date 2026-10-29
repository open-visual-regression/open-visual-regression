import type { Locator, Page } from "@playwright/test";

export class IntegrationsSettingsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/settings/integrations");
  }

  appName(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }

  connectedBadge(): Locator {
    return this.page.getByText("connected", { exact: true });
  }

  installation(accountLogin: string): Locator {
    return this.page.getByRole("listitem").filter({ hasText: accountLogin });
  }
}
