import type { Locator, Page } from "@playwright/test";

export class SnapshotsPage {
  constructor(private readonly page: Page) {}

  heading(): Locator {
    return this.page.getByRole("heading", { name: "Snapshots", level: 1 });
  }

  cardsForProject(projectName: string): Locator {
    return this.page
      .getByRole("main")
      .getByRole("link", { name: new RegExp(`^Snapshot of .+, ${projectName}, `) });
  }

  cardsNotForProject(projectName: string): Locator {
    return this.page
      .getByRole("main")
      .getByRole("link", { name: new RegExp(`^Snapshot of (?!.+, ${projectName}, )`) });
  }

  facetTrigger(label: string): Locator {
    return this.page.getByRole("button", { name: new RegExp(`^${label}\\s`, "i") });
  }

  async filterBy(label: string, option: string) {
    await this.facetTrigger(label).click();
    await this.page.getByRole("checkbox", { name: option }).click();
    await this.page.getByRole("button", { name: "Apply" }).click();
  }
}
