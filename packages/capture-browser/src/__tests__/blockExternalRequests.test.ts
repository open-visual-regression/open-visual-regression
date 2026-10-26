import type { Page } from "playwright";

import { newPage } from "../browser";
import { blockExternalRequests } from "../page";
import { settlePage, trackNetworkActivity } from "../settle";
import { describe, expect, test } from "./fixtures";

const isReachable = (page: Page, url: string) =>
  page.evaluate(
    (resource) =>
      fetch(resource, { mode: "no-cors" }).then(
        () => true,
        () => false,
      ),
    url,
  );

describe("blockExternalRequests", () => {
  test("blocks requests to anything but the target, including other local ports", async ({
    browser,
    site,
    otherSite,
  }) => {
    const page = await newPage(
      await browser.newContext(blockExternalRequests(browser, site.origin)),
    );
    await page.goto(`${site.origin}/service-worker.html`);

    expect(await isReachable(page, `${site.origin}/service-worker.js`)).toBe(true);
    expect(await isReachable(page, `${otherSite.origin}/service-worker.js`)).toBe(false);
    expect(
      await isReachable(
        page,
        `${otherSite.origin.replace("localhost", "127.0.0.1")}/service-worker.js`,
      ),
    ).toBe(false);
  });

  test("lets settling wait for a request a service worker answers after a delay", async ({
    browser,
    site,
  }) => {
    const page = await newPage(
      await browser.newContext(blockExternalRequests(browser, site.origin)),
    );
    const activity = trackNetworkActivity(page);

    await page.goto(`${site.origin}/service-worker.html`);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

    await page.evaluate(() => {
      void fetch("/api/data")
        .then((response) => response.text())
        .then((text) => {
          document.getElementById("status")!.textContent = text;
        });
    });

    await expect(settlePage(page, activity, 10_000)).resolves.toBe(true);
    expect(await page.textContent("#status")).toBe("done");
  });
});
