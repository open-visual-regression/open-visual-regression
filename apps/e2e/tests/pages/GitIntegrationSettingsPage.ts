import type { Locator, Page } from "@playwright/test";

export class GitIntegrationSettingsPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}/settings`);
  }

  authenticationSelect(): Locator {
    return this.page.getByRole("combobox", { name: /authentication/i });
  }

  repositoryPicker(): Locator {
    return this.page.getByRole("combobox", { name: /^repository$/i });
  }

  async chooseRepository(fullName: string) {
    await this.repositoryPicker().fill(fullName.split("/").at(-1) ?? fullName);
    await this.page.getByRole("option", { name: fullName }).click();
  }

  saveButton(): Locator {
    return this.page.getByRole("button", { name: /^save$/i });
  }

  testConnectionButton(): Locator {
    return this.page.getByRole("button", { name: /test connection/i });
  }

  toast(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }
}
