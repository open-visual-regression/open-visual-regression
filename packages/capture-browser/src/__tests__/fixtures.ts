import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, firefox, webkit, type Browser, type LaunchOptions } from "playwright";
import { test as vitest } from "vitest";

import type { BrowserEngine } from "../allowedHosts";
import { startStaticProxy, type StaticProxy } from "../staticProxy";

export { describe, expect } from "vitest";

const HTML_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "html");

export type ExternalSite = { origin: string; host: string; close: () => void };

// Stands in for a remote host. It's served on this machine's network address, not loopback, so
// every engine sends its requests through the capture proxy unless they bypass it.
const startExternalSite = async (): Promise<ExternalSite> => {
  const address = Object.values(networkInterfaces())
    .flat()
    .find((entry) => entry?.family === "IPv4" && !entry.internal)?.address;
  if (!address) {
    throw new Error("These tests need a non-loopback IPv4 address to stand in for a remote host");
  }

  const pixel = await readFile(path.join(HTML_DIR, "pixel.png"));
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const delayMs = Number(url.searchParams.get("delay") ?? 0);
    setTimeout(() => {
      const image = url.pathname.endsWith(".png");
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": image ? "image/png" : "text/plain",
      });
      res.end(image ? pixel : "external");
    }, delayMs);
  });

  await new Promise<void>((resolve) => server.listen(0, "0.0.0.0", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    origin: `http://${address}:${port}`,
    host: `${address}:${port}`,
    close: () => server.close(),
  };
};

const ENGINES = { chromium, firefox, webkit };

// CI installs every engine. Locally, an engine that isn't installed is skipped.
export const availableEngines = (Object.keys(ENGINES) as BrowserEngine[]).filter(
  (engine) => Boolean(process.env.CI) || existsSync(ENGINES[engine].executablePath()),
);

export const launchEngine = (engine: BrowserEngine, options: LaunchOptions = {}) =>
  ENGINES[engine].launch({
    ...options,
    args: [...(engine === "chromium" ? ["--disable-dev-shm-usage"] : []), ...(options.args ?? [])],
  });

type Fixtures = {
  browser: Browser;
  site: StaticProxy;
  otherSite: StaticProxy;
  externalSite: ExternalSite;
  otherExternalSite: ExternalSite;
};

export const test = vitest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  browser: async ({}, use) => {
    const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
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
