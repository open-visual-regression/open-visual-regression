import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Browser } from "playwright";
import { test as vitest } from "vitest";

import { startStaticProxy, type StaticProxy } from "../staticProxy";

export { describe, expect } from "vitest";

const HTML_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "html");

type Fixtures = {
  browser: Browser;
  site: StaticProxy;
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
});
