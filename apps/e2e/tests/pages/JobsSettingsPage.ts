import type { Locator, Page } from "@playwright/test";

export class JobsSettingsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/settings/jobs");
  }

  flakyDetectionSwitch(): Locator {
    return this.page.getByRole("switch", { name: /detect flaky stories/i });
  }

  windowBuildsField(): Locator {
    return this.page.getByLabel(/builds to look back on/i);
  }

  saveButton(): Locator {
    return this.page.getByRole("button", { name: /save changes/i });
  }

  successToast(): Locator {
    return this.page.getByText("flaky detection updated");
  }
}
