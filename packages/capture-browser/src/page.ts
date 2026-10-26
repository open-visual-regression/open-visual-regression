import type { Browser, BrowserContextOptions, Page } from "playwright";

import type { CaptureStrategy } from "./captureStrategies";
import { BOOT_TIMEOUT_MS } from "./timeouts";

const DEFAULT_VIEWPORT_HEIGHT = 800;

export type CaptureViewport = {
  width: number;
  height: number;
  fullPage: boolean;
};

export const getCaptureViewport = (
  viewportWidth: number,
  viewportHeight: number,
): CaptureViewport => {
  const fullPage = viewportHeight === 0;

  return {
    width: viewportWidth,
    height: fullPage ? DEFAULT_VIEWPORT_HEIGHT : viewportHeight,
    fullPage,
  };
};

const UNREACHABLE_PROXY = "http://127.0.0.1:9";

// Blocks other hosts with a proxy that refuses every connection. Blocking them with page.route
// would make Playwright report a request a service worker answers, like an msw mock, only once
// it has a response, so settling would not wait for it. Firefox can't exclude a single port from
// the proxy, so other localhost ports stay reachable there.
export const blockExternalRequests = (
  browser: Browser,
  origin: string,
): Pick<BrowserContextOptions, "proxy"> => {
  const { host, hostname } = new URL(origin);
  const bypass = browser.browserType().name() === "firefox" ? hostname : `<-loopback>,${host}`;

  return { proxy: { server: UNREACHABLE_PROXY, bypass } };
};

export const bootTargetPage = async (
  page: Page,
  origin: string,
  strategy: CaptureStrategy,
): Promise<void> => {
  await page.goto(`${origin}/${strategy.entryPath}`, { waitUntil: "load" });
  await strategy.waitForBoot(page, BOOT_TIMEOUT_MS);
};

export const takeScreenshot = (page: Page, fullPage: boolean): Promise<Buffer> =>
  page.screenshot({ fullPage, animations: "disabled" });
