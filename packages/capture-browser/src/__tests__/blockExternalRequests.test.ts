import http from "node:http";
import type { AddressInfo } from "node:net";

import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { newPage } from "../browser";
import { blockExternalRequests } from "../page";
import { settlePage, trackNetworkActivity } from "../settle";

const MOCKED_DELAY_MS = 400;

const PAGE_HTML = `<!doctype html>
<html>
  <body>
    <div id="status">loading</div>
    <script>
      navigator.serviceWorker.register("/sw.js");
    </script>
  </body>
</html>`;

// Answers /api/data itself after a delay, the way msw answers a mocked request.
const SERVICE_WORKER_JS = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (new URL(event.request.url).pathname === "/api/data") {
    event.respondWith(
      new Promise((resolve) => setTimeout(() => resolve(new Response("done")), ${MOCKED_DELAY_MS})),
    );
  }
});
`;

const listen = async (handler: http.RequestListener) => {
  const server = http.createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
};

const portOf = (server: http.Server) => (server.address() as AddressInfo).port;

let browser: Browser;
let target: http.Server;
let other: http.Server;
let origin: string;

beforeAll(async () => {
  target = await listen((req, res) => {
    if (req.url === "/sw.js") {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(SERVICE_WORKER_JS);
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(PAGE_HTML);
  });
  other = await listen((_req, res) => {
    res.writeHead(200, { "Access-Control-Allow-Origin": "*" });
    res.end("reached");
  });
  origin = `http://localhost:${portOf(target)}`;

  browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
});

afterAll(async () => {
  await browser?.close();
  for (const server of [target, other]) {
    server?.closeAllConnections();
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  }
});

describe("blockExternalRequests", () => {
  test("blocks requests to anything but the target, including other local ports", async () => {
    const page = await newPage(await browser.newContext(blockExternalRequests(browser, origin)));
    await page.goto(origin);

    const fetchFrom = (url: string) =>
      page.evaluate(
        (resource) =>
          fetch(resource).then(
            (response) => response.text(),
            () => "blocked",
          ),
        url,
      );

    expect(await fetchFrom(`${origin}/sw.js`)).toContain("addEventListener");
    expect(await fetchFrom(`http://localhost:${portOf(other)}/`)).toBe("blocked");
    expect(await fetchFrom(`http://127.0.0.1:${portOf(other)}/`)).toBe("blocked");
    expect(await fetchFrom("http://example.com/")).toBe("blocked");
  }, 30_000);

  test("lets settling wait for a request a service worker answers after a delay", async () => {
    const page = await newPage(await browser.newContext(blockExternalRequests(browser, origin)));
    const activity = trackNetworkActivity(page);

    await page.goto(origin);
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
  }, 30_000);
});
