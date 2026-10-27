import { existsSync } from "node:fs";

import { chromium, firefox, webkit, type Browser, type Page } from "playwright";

import { newPage } from "../browser";
import { blockExternalRequests } from "../page";
import { settlePage, trackNetworkActivity } from "../settle";
import { EXTERNAL_ADDRESS, describe, expect, test } from "./fixtures";

// CI installs Chromium only.
const BROWSER_TYPES = [chromium, firefox, webkit].map((browserType) => ({
  name: browserType.name(),
  browserType,
  installed: existsSync(browserType.executablePath()),
}));

const isReachable = (page: Page, url: string) =>
  page.evaluate(
    (resource) =>
      fetch(resource, { mode: "no-cors" }).then(
        () => true,
        () => false,
      ),
    url,
  );

// The response body, or null when the request failed.
const fetchText = (page: Page, url: string) =>
  page.evaluate(
    (resource) =>
      fetch(resource).then(
        (response) => response.text(),
        () => null,
      ),
    url,
  );

const openPage = async (
  browser: Browser,
  origin: string,
  allowlist: string[] | null,
  pagePath: "blank.html" | "passthrough.html",
) => {
  const page = await newPage(
    await browser.newContext(blockExternalRequests(browser, origin, allowlist)),
  );
  await page.goto(`${origin}/${pagePath}`);
  if (pagePath === "passthrough.html") {
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  }
  return page;
};

// Fetches the URL from the page, and through a service worker that fetches it like msw does.
const fetchBothWays = async (
  browser: Browser,
  origin: string,
  allowlist: string[] | null,
  url: string,
) => ({
  direct: await fetchText(await openPage(browser, origin, allowlist, "blank.html"), url),
  serviceWorker: await fetchText(
    await openPage(browser, origin, allowlist, "passthrough.html"),
    url,
  ),
});

describe("blockExternalRequests", () => {
  test("blocks nothing without an allowlist", async ({ browser, site, externalSite }) => {
    expect(await fetchBothWays(browser, site.origin, null, `${externalSite.origin}/data`)).toEqual({
      direct: "external",
      serviceWorker: "service worker: external",
    });
  });

  test("blocks requests to anything but the target, including other local ports", async ({
    browser,
    site,
    otherSite,
  }) => {
    const page = await openPage(browser, site.origin, [], "blank.html");

    expect(await isReachable(page, `${site.origin}/pixel.png`)).toBe(true);
    expect(await isReachable(page, `${otherSite.origin}/pixel.png`)).toBe(false);
    expect(
      await isReachable(page, `${otherSite.origin.replace("localhost", "127.0.0.1")}/pixel.png`),
    ).toBe(false);
  });

  test("lets settling wait for a request a service worker answers after a delay", async ({
    browser,
    site,
  }) => {
    const page = await newPage(
      await browser.newContext(blockExternalRequests(browser, site.origin, [])),
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

  describe("by host name", () => {
    // Resolves *.test to the external site.
    test.override({
      launchOptions: { args: [`--host-resolver-rules=MAP *.test ${EXTERNAL_ADDRESS}`] },
    });

    test("allows exact hosts and a wildcard's subdomains", async ({
      browser,
      site,
      externalSite,
    }) => {
      const { port } = new URL(externalSite.origin);
      const page = await openPage(
        browser,
        site.origin,
        ["exact.test", "*.wild.test"],
        "blank.html",
      );
      const load = (host: string) => fetchText(page, `http://${host}:${port}/data`);

      expect(await load("exact.test")).toBe("external");
      expect(await load("a.wild.test")).toBe("external");
      expect(await load("sub.exact.test")).toBeNull();
      expect(await load("wild.test")).toBeNull();
      expect(await load("other.test")).toBeNull();
    });
  });

  describe.each(BROWSER_TYPES)("with an allowlist in $name", ({ browserType, installed }) => {
    test.override({ browserType });

    test.skipIf(!installed)(
      "loads an allowed host directly and through a service worker",
      async ({ browser, site, externalSite }) => {
        expect(
          await fetchBothWays(
            browser,
            site.origin,
            [externalSite.host],
            `${externalSite.origin}/data`,
          ),
        ).toEqual({ direct: "external", serviceWorker: "service worker: external" });
      },
    );

    test.skipIf(!installed)(
      "blocks a host that isn't allowed, directly and through a service worker",
      async ({ browser, site, externalSite }) => {
        expect(
          await fetchBothWays(
            browser,
            site.origin,
            ["images.example.com"],
            `${externalSite.origin}/data`,
          ),
        ).toEqual({ direct: null, serviceWorker: null });
      },
    );

    // Firefox can't limit an allowed host to one port.
    test.skipIf(!installed || browserType === firefox)(
      "blocks other ports of a host allowed on one port",
      async ({ browser, site, externalSite, otherExternalSite }) => {
        expect(
          await fetchBothWays(
            browser,
            site.origin,
            [externalSite.host],
            `${otherExternalSite.origin}/data`,
          ),
        ).toEqual({ direct: null, serviceWorker: null });
      },
    );

    test.skipIf(!installed)(
      "lets settling wait for an allowed host a service worker answers after a delay",
      async ({ browser, site, externalSite }) => {
        const page = await openPage(browser, site.origin, [externalSite.host], "passthrough.html");
        const activity = trackNetworkActivity(page);

        await page.evaluate((url) => {
          void fetch(url)
            .then((response) => response.text())
            .then((text) => {
              document.getElementById("status")!.textContent = text;
            });
        }, `${externalSite.origin}/slow`);

        await expect(settlePage(page, activity, 10_000)).resolves.toBe(true);
        expect(await page.textContent("#status")).toBe("service worker: external");
      },
    );
  });
});
