import { readFile } from "node:fs/promises";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Browser, type BrowserType, type LaunchOptions } from "playwright";
import { test as vitest } from "vitest";

import { startStaticProxy, type StaticProxy } from "../staticProxy";

export { describe, expect } from "vitest";

const HTML_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "html");

// Not loopback, so every browser sends requests to it through the proxy.
export const EXTERNAL_ADDRESS = Object.values(networkInterfaces())
  .flat()
  .find((entry) => entry?.family === "IPv4" && !entry.internal)?.address;

export type ExternalSite = { origin: string; host: string; close: () => void };

// Answers with CORS headers, after ?delay= milliseconds.
const startExternalSite = async (): Promise<ExternalSite> => {
  const pixel = await readFile(path.join(HTML_DIR, "pixel.png"));
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    setTimeout(
      () => {
        const isImage = url.pathname.endsWith(".png");
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": isImage ? "image/png" : "text/plain",
        });
        res.end(isImage ? pixel : "external");
      },
      Number(url.searchParams.get("delay") ?? 0),
    );
  });

  await new Promise<void>((resolve) => server.listen(0, "0.0.0.0", resolve));
  const { port } = server.address() as AddressInfo;
  const host = `${EXTERNAL_ADDRESS}:${port}`;

  return { origin: `http://${host}`, host, close: () => server.close() };
};

type Fixtures = {
  browserType: BrowserType;
  launchOptions: LaunchOptions;
  browser: Browser;
  site: StaticProxy;
  otherSite: StaticProxy;
  externalSite: ExternalSite;
  otherExternalSite: ExternalSite;
};

export const test = vitest.extend<Fixtures>({
  browserType: chromium,

  launchOptions: {},

  browser: async ({ browserType, launchOptions }, use) => {
    const args = browserType === chromium ? ["--disable-dev-shm-usage"] : [];
    const browser = await browserType.launch({
      ...launchOptions,
      args: [...args, ...(launchOptions.args ?? [])],
    });
    await use(browser);
    await browser.close();
  },

  // eslint-disable-next-line no-empty-pattern
  site: async ({}, use) => {
    const proxy = await startStaticProxy(HTML_DIR);
    await use(proxy);
    proxy.close();
  },

  // eslint-disable-next-line no-empty-pattern
  otherSite: async ({}, use) => {
    const proxy = await startStaticProxy(HTML_DIR);
    await use(proxy);
    proxy.close();
  },

  // eslint-disable-next-line no-empty-pattern
  externalSite: async ({}, use) => {
    const site = await startExternalSite();
    await use(site);
    site.close();
  },

  // eslint-disable-next-line no-empty-pattern
  otherExternalSite: async ({}, use) => {
    const site = await startExternalSite();
    await use(site);
    site.close();
  },
});
