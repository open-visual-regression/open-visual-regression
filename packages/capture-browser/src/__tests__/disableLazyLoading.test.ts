import http from "node:http";
import type { AddressInfo } from "node:net";

import { chromium, type Browser, type Page } from "playwright";
import { PNG } from "pngjs";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { newPage } from "../browser";
import { disableLazyLoading } from "../page";
import { settlePage, trackNetworkActivity } from "../settle";

// Both images sit far below the viewport: one is in the markup, the other is added the way a
// component would add it after its data loads.
const PAGE_HTML = `<!doctype html>
<html>
  <body>
    <div style="height: 5000px"></div>
    <img id="initial" loading="lazy" src="/image.png" />
    <script>
      setTimeout(() => {
        const image = document.createElement("img");
        image.id = "added";
        image.loading = "lazy";
        image.src = "/image.png?added";
        document.body.append(image);
      }, 50);
    </script>
  </body>
</html>`;

const onePixelPng = (): Buffer => {
  const png = new PNG({ width: 1, height: 1 });
  png.data.set([0, 128, 0, 255]);
  return PNG.sync.write(png);
};

const isLoaded = (page: Page, id: string) =>
  page.evaluate((imageId) => {
    const image = document.getElementById(imageId) as HTMLImageElement | null;
    return Boolean(image?.complete && image.naturalWidth > 0);
  }, id);

let browser: Browser;
let server: http.Server;
let origin: string;

beforeAll(async () => {
  const image = onePixelPng();

  server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");

    if (url.pathname === "/image.png") {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(image);
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(PAGE_HTML);
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

describe("disableLazyLoading", () => {
  test("loads lazy images outside the viewport, including ones added after the page loads", async () => {
    const page = await newPage(await browser.newContext());
    await disableLazyLoading(page);
    const activity = trackNetworkActivity(page);

    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#added", { state: "attached" });

    await expect(settlePage(page, activity, 10_000)).resolves.toBe(true);
    expect(await isLoaded(page, "initial")).toBe(true);
    expect(await isLoaded(page, "added")).toBe(true);
  }, 30_000);

  test("leaves lazy images outside the viewport unloaded without it", async () => {
    const page = await newPage(await browser.newContext());
    const activity = trackNetworkActivity(page);

    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#added", { state: "attached" });

    await expect(settlePage(page, activity, 10_000)).resolves.toBe(true);
    expect(await isLoaded(page, "initial")).toBe(false);
    expect(await isLoaded(page, "added")).toBe(false);
  }, 30_000);
});
