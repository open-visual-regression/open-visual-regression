import type { Locator, Page } from "@playwright/test";

type WatchedWindow = Window & { __sidebarViolations?: string[] };

export class AppSidebar {
  constructor(private readonly page: Page) {}

  // Runs before any page script on every document, so it also sees streamed server HTML.
  async watch() {
    await this.page.addInitScript(() => {
      const violations: string[] = [];
      (window as WatchedWindow).__sidebarViolations = violations;
      const check = () => {
        const slot = document.querySelector('[data-slot="sidebar"]');
        for (const element of slot?.children ?? []) {
          const tag = element.tagName.toLowerCase();
          if (tag === "aside" || tag === "template" || (element as HTMLElement).hidden) {
            continue;
          }
          const violation = `${location.pathname}: <${tag} class="${element.className}">`;
          if (violations.at(-1) !== violation) {
            violations.push(violation);
          }
        }
      };
      new MutationObserver(check).observe(document, { childList: true, subtree: true });
    });
  }

  // Everything the sidebar column rendered that was not the sidebar, since the last document load.
  async violations(): Promise<string[]> {
    return this.page.evaluate(() => (window as WatchedWindow).__sidebarViolations ?? []);
  }

  // Delays client navigations (not prefetches) so their loading states are on screen long enough to observe.
  async slowNavigations(delayMs: number) {
    await this.page.route("**/*", async (route) => {
      const headers = route.request().headers();
      if (headers["rsc"] === "1" && !headers["next-router-prefetch"]) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      await route.continue();
    });
  }

  link(name: string | RegExp): Locator {
    return this.page
      .locator('[data-slot="sidebar"]')
      .getByRole("link", { name, exact: typeof name === "string" });
  }

  linkTo(href: string): Locator {
    return this.page.locator(`[data-slot="sidebar"] a[href="${href}"]`);
  }
}
