import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { chromium, type Browser } from "playwright";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

import { newPage } from "../browser";
import { startStaticProxy, type StaticProxy } from "../staticProxy";

const PAGE_HTML = `<!doctype html>
<html>
  <body>
    <script src="/bundle.js"></script>
  </body>
</html>`;

describe("startStaticProxy", () => {
  let browser: Browser;
  let dir: string;
  let proxy: StaticProxy;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "ovr-static-proxy-"));
    await writeFile(path.join(dir, "iframe.html"), PAGE_HTML);
    await writeFile(path.join(dir, "bundle.js"), "window.__BUNDLE__ = 'first';");
    proxy = await startStaticProxy(dir);
  });

  afterEach(async () => {
    proxy.close();
    await rm(dir, { recursive: true, force: true });
  });

  test("should let a reloaded page reuse the bundle it already loaded", async () => {
    const page = await newPage(await browser.newContext());
    await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });

    // Only a page that downloads the bundle again would see this.
    await writeFile(path.join(dir, "bundle.js"), "window.__BUNDLE__ = 'second';");
    await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });

    expect(await page.evaluate(() => (window as { __BUNDLE__?: string }).__BUNDLE__)).toBe("first");
  });
});
