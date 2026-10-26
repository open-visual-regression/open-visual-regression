import type { Page } from "playwright";

import { newPage } from "../browser";
import { disableLazyLoading } from "../page";
import { settlePage, trackNetworkActivity } from "../settle";
import { describe, expect, test } from "./fixtures";

const isLoaded = (page: Page, id: string) =>
  page.evaluate((imageId) => {
    const image = document.getElementById(imageId) as HTMLImageElement | null;
    return Boolean(image?.complete && image.naturalWidth > 0);
  }, id);

describe("disableLazyLoading", () => {
  test("loads lazy images outside the viewport, including ones added after the page loads", async ({
    browser,
    site,
  }) => {
    const page = await newPage(await browser.newContext());
    await disableLazyLoading(page);
    const activity = trackNetworkActivity(page);

    await page.goto(`${site.origin}/lazy-images.html`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#added", { state: "attached" });

    await expect(settlePage(page, activity, 10_000)).resolves.toBe(true);
    expect(await isLoaded(page, "initial")).toBe(true);
    expect(await isLoaded(page, "added")).toBe(true);
  });

  test("leaves lazy images outside the viewport unloaded without it", async ({ browser, site }) => {
    const page = await newPage(await browser.newContext());
    const activity = trackNetworkActivity(page);

    await page.goto(`${site.origin}/lazy-images.html`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#added", { state: "attached" });

    await expect(settlePage(page, activity, 10_000)).resolves.toBe(true);
    expect(await isLoaded(page, "initial")).toBe(false);
    expect(await isLoaded(page, "added")).toBe(false);
  });
});
