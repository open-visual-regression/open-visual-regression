import type { Locator, Page } from "@playwright/test";

export class SnapshotsPage {
  constructor(private readonly page: Page) {}

  heading(): Locator {
    return this.page.getByRole("heading", { name: "snapshots", level: 1 });
  }

  cardsForProject(projectName: string): Locator {
    return this.page
      .getByRole("main")
      .getByRole("link", { name: new RegExp(`^snapshot of .+, ${projectName}, `) });
  }

  cardsNotForProject(projectName: string): Locator {
    return this.page
      .getByRole("main")
      .getByRole("link", { name: new RegExp(`^snapshot of (?!.+, ${projectName}, )`) });
  }

  facetTrigger(label: string): Locator {
    return this.page.getByRole("button", { name: new RegExp(`^${label}\\s`, "i") });
  }

  async filterBy(label: string, option: string) {
    await this.facetTrigger(label).click();
    await this.page.getByRole("checkbox", { name: option }).click();
    await this.page.getByRole("button", { name: "apply" }).click();
  }
}
