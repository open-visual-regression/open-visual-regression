import type { Page } from "playwright";

import { newPage } from "../browser";
import { blockExternalRequests, trackBlockedHosts } from "../page";
import { describe, expect, test } from "./fixtures";

const tryFetch = (page: Page, url: string) =>
  page.evaluate((resource) => fetch(resource).catch(() => undefined), url);

describe("trackBlockedHosts", () => {
  test("reports each blocked host once, leaving out allowed hosts and the target", async ({
    browser,
    site,
    externalSite,
  }) => {
    const allowlist = [externalSite.host];
    const page = await newPage(
      await browser.newContext(blockExternalRequests(browser, site.origin, allowlist)),
    );
    const blockedHosts = trackBlockedHosts(page, site.origin, allowlist);
    await page.goto(`${site.origin}/passthrough.html`);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

    await tryFetch(page, "http://blocked.invalid/a.png");
    await tryFetch(page, "http://blocked.invalid/b.png");
    await tryFetch(page, "http://other.invalid:8080/c.png");
    await tryFetch(page, `${externalSite.origin}/data`);
    await tryFetch(page, `${site.origin}/missing.png`);

    expect(blockedHosts.take()).toEqual(["blocked.invalid", "other.invalid:8080"]);
    expect(blockedHosts.take()).toEqual([]);
  });

  test("reports nothing without an allowlist", async ({ browser, site }) => {
    const page = await newPage(await browser.newContext());
    const blockedHosts = trackBlockedHosts(page, site.origin, null);
    await page.goto(`${site.origin}/blank.html`);

    await tryFetch(page, "http://blocked.invalid/a.png");

    expect(blockedHosts.take()).toEqual([]);
  });
});
