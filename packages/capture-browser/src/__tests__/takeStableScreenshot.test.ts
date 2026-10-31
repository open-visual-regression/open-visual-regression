import type { Browser, Page } from "playwright";

import { newPage } from "../browser";
import { MAX_STABILITY_SCREENSHOTS, takeScreenshot, takeStableScreenshot } from "../page";
import { describe, expect, test } from "./fixtures";

const STATIC_HTML = `<!doctype html><body><h1>Static</h1><p>Nothing here repaints.</p></body>`;

// Bars that grow over `duration` ms on a canvas, which never mutates the DOM.
const canvasHtml = (duration: number | "endless") => `<!doctype html>
<body>
  <canvas id="chart" width="200" height="100"></canvas>
  <script>
    const ctx = document.getElementById("chart").getContext("2d");
    const start = performance.now();
    const draw = (now) => {
      const elapsed = now - start;
      const t = ${duration === "endless" ? "(Math.sin(elapsed / 50) + 1) / 2" : `Math.min(elapsed / ${duration}, 1)`};
      ctx.clearRect(0, 0, 200, 100);
      ctx.fillStyle = "#4f46e5";
      ctx.fillRect(10, 100 - 90 * t, 50, 90 * t);
      ${duration === "endless" ? "requestAnimationFrame(draw);" : "if (t < 1) requestAnimationFrame(draw);"}
    };
    requestAnimationFrame(draw);
  </script>
</body>`;

const SHADOW_HTML = `<!doctype html>
<body>
  <div id="host"></div>
  <script>
    document.getElementById("host").attachShadow({ mode: "open" }).innerHTML = "<p>Inside</p>";
  </script>
</body>`;

const openPage = async (browser: Browser, html: string): Promise<Page> => {
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await newPage(context);
  await page.setContent(html);
  return page;
};

describe("takeStableScreenshot", () => {
  test("takes one screenshot of a page that can only repaint through the DOM", async ({
    browser,
  }) => {
    const page = await openPage(browser, STATIC_HTML);

    const result = await takeStableScreenshot(page, false, { mode: "auto" });

    expect(result).toMatchObject({ screenshots: 1, stable: true });
  });

  test("retakes the screenshot of an animating canvas until it stops changing", async ({
    browser,
  }) => {
    const page = await openPage(browser, canvasHtml(600));

    const result = await takeStableScreenshot(page, false, { mode: "auto" });

    expect(result.stable).toBe(true);
    expect(result.screenshots).toBeGreaterThan(2);
    // The animation has ended, so a later screenshot is the same final frame.
    await page.waitForTimeout(300);
    expect(result.image.equals(await takeScreenshot(page, false))).toBe(true);
  });

  test("checks a still canvas with one extra screenshot", async ({ browser }) => {
    const page = await openPage(browser, canvasHtml(0));

    const result = await takeStableScreenshot(page, false, { mode: "auto" });

    expect(result).toMatchObject({ screenshots: 2, stable: true });
  });

  test("checks a page with a shadow root, whose changes settlePage can't see", async ({
    browser,
  }) => {
    const page = await openPage(browser, SHADOW_HTML);

    const result = await takeStableScreenshot(page, false, { mode: "auto" });

    expect(result).toMatchObject({ screenshots: 2, stable: true });
  });

  test("gives up on a canvas that never stops changing", async ({ browser }) => {
    const page = await openPage(browser, canvasHtml("endless"));

    const start = Date.now();
    const result = await takeStableScreenshot(page, false, { mode: "auto", timeoutMs: 1_000 });

    expect(result.stable).toBe(false);
    expect(result.screenshots).toBeLessThanOrEqual(MAX_STABILITY_SCREENSHOTS);
    expect(Date.now() - start).toBeLessThan(2_500);
  });

  test("stops after the screenshot cap even when time is left", async ({ browser }) => {
    const page = await openPage(browser, canvasHtml("endless"));

    const result = await takeStableScreenshot(page, false, { mode: "auto", timeoutMs: 60_000 });

    expect(result).toMatchObject({ screenshots: MAX_STABILITY_SCREENSHOTS, stable: false });
  });

  test('checks every page with "always"', async ({ browser }) => {
    const page = await openPage(browser, STATIC_HTML);

    const result = await takeStableScreenshot(page, false, { mode: "always" });

    expect(result).toMatchObject({ screenshots: 2, stable: true });
  });

  test('takes one screenshot with "off", even of an animating canvas', async ({ browser }) => {
    const page = await openPage(browser, canvasHtml("endless"));

    const result = await takeStableScreenshot(page, false, { mode: "off" });

    expect(result).toMatchObject({ screenshots: 1, stable: true });
  });
});
