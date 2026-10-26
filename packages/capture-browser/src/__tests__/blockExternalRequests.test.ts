import type { Browser, LaunchOptions, Page } from "playwright";

import { parseAllowedHosts, type BrowserEngine } from "../allowedHosts";
import { newPage } from "../browser";
import { blockExternalRequests, trackBlockedHosts } from "../page";
import { settlePage, trackNetworkActivity } from "../settle";
import { availableEngines, describe, expect, launchEngine, test } from "./fixtures";

const isReachable = (page: Page, url: string) =>
  page.evaluate(
    (resource) =>
      fetch(resource, { mode: "no-cors" }).then(
        () => true,
        () => false,
      ),
    url,
  );

// The body, or null when the request failed.
const fetchText = (page: Page, url: string) =>
  page.evaluate(
    (resource) =>
      fetch(resource).then(
        (response) => response.text(),
        () => null,
      ),
    url,
  );

const withEngine = async (
  engine: BrowserEngine,
  run: (browser: Browser) => Promise<void>,
  options?: LaunchOptions,
) => {
  const browser = await launchEngine(engine, options);
  try {
    await run(browser);
  } finally {
    await browser.close();
  }
};

type CapturePage = "blank.html" | "passthrough.html";

const openPage = async (
  browser: Browser,
  origin: string,
  allowedHosts: string[],
  entry: CapturePage,
): Promise<Page> => {
  const page = await newPage(
    await browser.newContext(
      blockExternalRequests(browser, origin, parseAllowedHosts(allowedHosts)),
    ),
  );
  await page.goto(`${origin}/${entry}`);
  if (entry === "passthrough.html") {
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  }
  return page;
};

// What a capture page gets for each way it can request a URL: directly, and through a service
// worker that fetches it itself, like an msw pass-through.
const loadBothWays = async (
  browser: Browser,
  origin: string,
  allowedHosts: string[],
  url: string,
) => {
  const direct = await openPage(browser, origin, allowedHosts, "blank.html");
  const throughServiceWorker = await openPage(browser, origin, allowedHosts, "passthrough.html");
  return {
    direct: await fetchText(direct, url),
    serviceWorker: await fetchText(throughServiceWorker, url),
  };
};

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

  for (const engine of ["chromium", "webkit", "firefox"] as const) {
    describe.skipIf(!availableEngines.includes(engine))(`with allowed hosts in ${engine}`, () => {
      test("loads an allowed host directly and through a service worker's pass-through fetch", async ({
        site,
        externalSite,
      }) => {
        await withEngine(engine, async (browser) => {
          expect(
            await loadBothWays(
              browser,
              site.origin,
              [externalSite.host],
              `${externalSite.origin}/data`,
            ),
          ).toEqual({ direct: "external", serviceWorker: "service worker: external" });
        });
      });

      test("keeps a host that isn't allowed blocked, directly and through a service worker", async ({
        site,
        externalSite,
      }) => {
        await withEngine(engine, async (browser) => {
          expect(
            await loadBothWays(
              browser,
              site.origin,
              ["images.example.com"],
              `${externalSite.origin}/data`,
            ),
          ).toEqual({ direct: null, serviceWorker: null });
        });
      });

      // Firefox can't limit an allowed host to one port.
      test.skipIf(engine === "firefox")(
        "keeps other ports of an allowed host blocked when the entry names a port",
        async ({ site, externalSite, otherExternalSite }) => {
          await withEngine(engine, async (browser) => {
            expect(
              await loadBothWays(
                browser,
                site.origin,
                [externalSite.host],
                `${otherExternalSite.origin}/data`,
              ),
            ).toEqual({ direct: null, serviceWorker: null });
          });
        },
      );

      test("keeps loading the capture origin and blocking other loopback ports", async ({
        site,
        otherSite,
        externalSite,
      }) => {
        await withEngine(engine, async (browser) => {
          const page = await openPage(browser, site.origin, [externalSite.host], "blank.html");

          expect(await isReachable(page, `${site.origin}/pixel.png`)).toBe(true);
          // Firefox can't exclude a single port from the proxy, so other localhost ports load there.
          if (engine !== "firefox") {
            expect(await isReachable(page, `${otherSite.origin}/pixel.png`)).toBe(false);
            expect(
              await isReachable(
                page,
                `${otherSite.origin.replace("localhost", "127.0.0.1")}/pixel.png`,
              ),
            ).toBe(false);
          }
        });
      });

      test("lets settling wait for an allowed external request a service worker answers slowly", async ({
        site,
        externalSite,
      }) => {
        await withEngine(engine, async (browser) => {
          const page = await openPage(
            browser,
            site.origin,
            [externalSite.host],
            "passthrough.html",
          );
          const activity = trackNetworkActivity(page);

          await page.evaluate((url) => {
            void fetch(url)
              .then((response) => response.text())
              .then((text) => {
                document.getElementById("status")!.textContent = text;
              });
          }, `${externalSite.origin}/data?delay=400`);

          await expect(settlePage(page, activity, 10_000)).resolves.toBe(true);
          expect(await page.textContent("#status")).toBe("service worker: external");
        });
      });

      test("reports each blocked host once, leaving out allowed hosts and the capture origin", async ({
        site,
        externalSite,
      }) => {
        await withEngine(engine, async (browser) => {
          const allowedHosts = [externalSite.host];
          const page = await openPage(browser, site.origin, allowedHosts, "passthrough.html");
          const blocked = trackBlockedHosts(page, site.origin, parseAllowedHosts(allowedHosts));

          await fetchText(page, "http://blocked.invalid/a.png");
          await fetchText(page, "http://blocked.invalid/b.png");
          await fetchText(page, `${externalSite.origin}/data`);
          await fetchText(page, `${site.origin}/missing.png`);
          const direct = await openPage(browser, site.origin, allowedHosts, "blank.html");
          const directBlocked = trackBlockedHosts(
            direct,
            site.origin,
            parseAllowedHosts(allowedHosts),
          );
          await fetchText(direct, "http://other.invalid:8080/a.png");

          expect(blocked.take()).toEqual(["blocked.invalid"]);
          expect(blocked.take()).toEqual([]);
          expect(directBlocked.take()).toEqual(["other.invalid:8080"]);
          blocked.dispose();
          directBlocked.dispose();
        });
      });
    });
  }

  describe.skipIf(!availableEngines.includes("chromium"))("allowed host names in chromium", () => {
    test("allows an exact host and a wildcard's subdomains, and nothing else", async ({
      site,
      externalSite,
    }) => {
      const { hostname, port } = new URL(externalSite.origin);

      await withEngine(
        "chromium",
        async (browser) => {
          const page = await openPage(
            browser,
            site.origin,
            ["exact.test", "*.wild.test"],
            "passthrough.html",
          );
          const load = (host: string) => fetchText(page, `http://${host}:${port}/data`);

          expect(await load("exact.test")).toBe("service worker: external");
          expect(await load("a.wild.test")).toBe("service worker: external");
          expect(await load("sub.exact.test")).toBeNull();
          expect(await load("wild.test")).toBeNull();
          expect(await load("other.test")).toBeNull();
        },
        { args: [`--host-resolver-rules=MAP *.test ${hostname}`] },
      );
    });
  });
});
