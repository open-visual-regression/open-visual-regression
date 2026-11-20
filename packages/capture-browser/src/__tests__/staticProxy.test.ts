import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { newPage } from "../browser";
import { startStaticProxy, type StaticProxy } from "../staticProxy";
import { describe, expect, test as baseTest } from "./fixtures";

const PAGE_HTML = `<!doctype html>
<html>
  <body>
    <script src="/bundle.js"></script>
  </body>
</html>`;

type Bundle = { proxy: StaticProxy; writeScript: (source: string) => Promise<void> };

// A bundle in its own directory, so a test can change it while the proxy serves it.
const test = baseTest.extend<{ bundle: Bundle }>({
  // eslint-disable-next-line no-empty-pattern
  bundle: async ({}, use) => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-static-proxy-"));
    const writeScript = (source: string) => writeFile(path.join(dir, "bundle.js"), source);
    await writeFile(path.join(dir, "iframe.html"), PAGE_HTML);
    await writeScript("window.__BUNDLE__ = 'first';");
    const proxy = await startStaticProxy(dir);
    await use({ proxy, writeScript });
    proxy.close();
    await rm(dir, { recursive: true, force: true });
  },
});

describe("startStaticProxy", () => {
  test("lets a reloaded page reuse the bundle it already loaded", async ({ browser, bundle }) => {
    const page = await newPage(await browser.newContext());
    await page.goto(`${bundle.proxy.origin}/iframe.html`, { waitUntil: "load" });

    // Only a page that downloads the bundle again would see this.
    await bundle.writeScript("window.__BUNDLE__ = 'second';");
    await page.goto(`${bundle.proxy.origin}/iframe.html`, { waitUntil: "load" });

    expect(await page.evaluate(() => (window as { __BUNDLE__?: string }).__BUNDLE__)).toBe("first");
  });
});
