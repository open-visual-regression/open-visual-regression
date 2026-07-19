import type { Locator, Page } from "@playwright/test";

export class BuildPage {
  constructor(private readonly page: Page) {}

  async goto(projectId: string, buildId: string) {
    await this.page.goto(`/projects/${projectId}/builds/${buildId}`);
  }

  status(): Locator {
    return this.page.getByRole("status");
  }

  cancelButton(): Locator {
    return this.page.getByRole("button", { name: "cancel build", exact: true });
  }

  approveAllButton(): Locator {
    return this.page.getByRole("button", { name: "approve all", exact: true });
  }

  snapshotProgress(): Locator {
    return this.page.getByText(/\d+ snapshots/i);
  }

  snapshots(): Locator {
    return this.page.getByRole("link", { name: /view snapshot/i });
  }
}
