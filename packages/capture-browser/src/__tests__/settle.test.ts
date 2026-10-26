import http from "node:http";
import type { AddressInfo } from "node:net";

import { chromium, type Browser, type Page } from "playwright";
import { PNG } from "pngjs";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { newPage } from "../browser";
import { settlePage, trackNetworkActivity } from "../settle";

const SLOW_RESPONSE_MS = 400;
const GIVE_UP_TIMEOUT_MS = 500;

const PAGE_HTML = `<!doctype html>
<html>
  <body>
    <div id="skeleton">loading</div>
    <img id="hero" hidden />
    <script>
      const hero = document.getElementById("hero");
      hero.addEventListener("load", () => {
        document.getElementById("skeleton").hidden = true;
        hero.hidden = false;
      });
      hero.src = new URLSearchParams(location.search).get("image");
    </script>
  </body>
</html>`;

const WATERFALL_HTML = `<!doctype html>
<html>
  <body>
    <div id="status">loading</div>
    <script>
      const status = document.getElementById("status");
      const step = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      (async () => {
        await fetch("/data.json");
        for (let index = 0; index < 6; index++) {
          status.textContent = "rendering " + index;
          await step(40);
        }
        await fetch("/slow-data.json");
        status.textContent = "done";
      })();
    </script>
  </body>
</html>`;

const TICKING_HTML = `<!doctype html>
<html>
  <body>
    <div id="clock">0</div>
    <script>
      let ticks = 0;
      setInterval(() => {
        document.getElementById("clock").textContent = String(++ticks);
      }, 50);
    </script>
  </body>
</html>`;

const OFFSCREEN_LAZY_IMAGE_HTML = `<!doctype html>
<html>
  <body>
    <div style="height: 5000px"></div>
    <img loading="lazy" src="/slow.png" />
  </body>
</html>`;

const HTML_PAGES: Record<string, string> = {
  "/waterfall": WATERFALL_HTML,
  "/ticking": TICKING_HTML,
  "/offscreen-lazy-image": OFFSCREEN_LAZY_IMAGE_HTML,
};

const onePixelPng = (): Buffer => {
  const png = new PNG({ width: 1, height: 1 });
  png.data.set([0, 128, 0, 255]);
  return PNG.sync.write(png);
};

const isSkeletonVisible = (page: Page) =>
  page.evaluate(() => document.getElementById("skeleton")?.hidden === false);

let browser: Browser;
let server: http.Server;
let origin: string;

beforeAll(async () => {
  const image = onePixelPng();

  server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");

    if (url.pathname === "/slow.png") {
      setTimeout(() => {
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(image);
      }, SLOW_RESPONSE_MS);
      return;
    }

    if (url.pathname === "/hang.png") {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.flushHeaders();
      return;
    }

    if (url.pathname === "/data.json" || url.pathname === "/slow-data.json") {
      setTimeout(
        () => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end("{}");
        },
        url.pathname === "/slow-data.json" ? SLOW_RESPONSE_MS : 0,
      );
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML_PAGES[url.pathname] ?? PAGE_HTML);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
});

afterAll(async () => {
  await browser?.close();
  server?.closeAllConnections();
  await new Promise<void>((resolve) => server?.close(() => resolve()));
});

describe("settlePage", () => {
  test("waits for a resource the render did not wait for", async () => {
    const page = await newPage(await browser.newContext());
    const activity = trackNetworkActivity(page);

    await page.goto(`${origin}/?image=/slow.png`, { waitUntil: "domcontentloaded" });
    expect(await isSkeletonVisible(page)).toBe(true);

    await expect(settlePage(page, activity, 10_000)).resolves.toBe(true);
    expect(await isSkeletonVisible(page)).toBe(false);
  }, 30_000);

  test("gives up once its budget runs out", async () => {
    const page = await newPage(await browser.newContext());
    const activity = trackNetworkActivity(page);

    await page.goto(`${origin}/?image=/hang.png`, { waitUntil: "domcontentloaded" });

    await expect(settlePage(page, activity, GIVE_UP_TIMEOUT_MS)).resolves.toBe(false);
    expect(await isSkeletonVisible(page)).toBe(true);
  }, 30_000);

  test("stops counting a request that outlived the budget, so it cannot stall later snapshots", async () => {
    const page = await newPage(await browser.newContext());
    const activity = trackNetworkActivity(page, GIVE_UP_TIMEOUT_MS);

    await page.goto(`${origin}/?image=/hang.png`, { waitUntil: "domcontentloaded" });

    await expect(settlePage(page, activity, GIVE_UP_TIMEOUT_MS)).resolves.toBe(false);
    await expect(settlePage(page, activity, GIVE_UP_TIMEOUT_MS)).resolves.toBe(true);
  }, 30_000);

  test("waits for a request that starts after a few renders", async () => {
    const page = await newPage(await browser.newContext());
    const activity = trackNetworkActivity(page);

    await page.goto(`${origin}/waterfall`, { waitUntil: "domcontentloaded" });

    await expect(settlePage(page, activity, 10_000)).resolves.toBe(true);
    expect(await page.textContent("#status")).toBe("done");
  }, 30_000);

  test("gives up early on a DOM that never stops changing", async () => {
    const page = await newPage(await browser.newContext());
    const activity = trackNetworkActivity(page);

    await page.goto(`${origin}/ticking`, { waitUntil: "domcontentloaded" });

    const startedAt = Date.now();
    await expect(settlePage(page, activity, 10_000)).resolves.toBe(false);
    expect(Date.now() - startedAt).toBeLessThan(5_000);
  }, 30_000);

  test("does not wait for a lazy image outside the viewport", async () => {
    const page = await newPage(await browser.newContext());
    const activity = trackNetworkActivity(page);

    await page.goto(`${origin}/offscreen-lazy-image`, { waitUntil: "domcontentloaded" });

    await expect(settlePage(page, activity, 10_000)).resolves.toBe(true);
  }, 30_000);
});
