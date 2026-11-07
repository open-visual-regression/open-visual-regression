import type { Locator, Page } from "@playwright/test";

export class GitIntegrationSettingsPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}/settings`);
  }

  repositoryField(): Locator {
    return this.page.getByLabel("repository");
  }

  authenticationSelect(): Locator {
    return this.page.getByRole("combobox", { name: "authentication" });
  }

  authenticationOption(name: string): Locator {
    return this.page.getByRole("option", { name });
  }

  tokenField(): Locator {
    return this.page.getByLabel("access token");
  }

  saveButton(): Locator {
    return this.page.getByRole("button", { name: /^save$/ });
  }

  testConnectionButton(): Locator {
    return this.page.getByRole("button", { name: "test connection" });
  }

  toast(text: string): Locator {
    return this.page.getByText(text);
  }
}
