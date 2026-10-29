import type { Locator, Page } from "@playwright/test";

export class IntegrationsSettingsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/settings/integrations");
  }

  providerSection(name: string): Locator {
    return this.page.getByRole("region", { name });
  }

  connection(section: Locator, name: string): Locator {
    return section.getByRole("listitem").filter({ hasText: name });
  }
}
