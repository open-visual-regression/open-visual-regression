import type { Browser } from "playwright";

import { newPage } from "../browser";
import { takeScreenshot, takeStableScreenshot } from "../page";
import { describe, expect, test } from "./fixtures";

const openPage = async (browser: Browser, url: string) => {
  const page = await newPage(await browser.newContext({ deviceScaleFactor: 1 }));
  await page.goto(url);
  return page;
};

describe("takeStableScreenshot", () => {
  test("waits for a canvas animation to finish", async ({ browser, site }) => {
    const page = await openPage(browser, `${site.origin}/canvas-animation.html?duration=600`);

    const { image, stable } = await takeStableScreenshot(page, false, "auto");

    expect(stable).toBe(true);
    await page.waitForTimeout(300);
    expect(image.equals(await takeScreenshot(page, false))).toBe(true);
  });

  test("gives up on a canvas that never stops changing", async ({ browser, site }) => {
    const page = await openPage(browser, `${site.origin}/canvas-animation.html?duration=endless`);

    await expect(takeStableScreenshot(page, false, "auto")).resolves.toMatchObject({
      stable: false,
    });
  });

  test("checks content that changes inside a shadow root", async ({ browser, site }) => {
    const page = await openPage(browser, `${site.origin}/shadow-ticker.html?mode=open`);

    await expect(takeStableScreenshot(page, false, "auto")).resolves.toMatchObject({
      stable: false,
    });
  });

  test('checks every page with "always", even content "auto" can\'t find', async ({
    browser,
    site,
  }) => {
    const page = await openPage(browser, `${site.origin}/shadow-ticker.html?mode=closed`);

    await expect(takeStableScreenshot(page, false, "always")).resolves.toMatchObject({
      stable: false,
    });
  });

  test('takes a single screenshot with "off"', async ({ browser, site }) => {
    const page = await openPage(browser, `${site.origin}/canvas-animation.html?duration=endless`);

    await expect(takeStableScreenshot(page, false, "off")).resolves.toMatchObject({
      stable: true,
    });
  });
});
