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

// Nothing listens here, so a request sent to it fails straight away.
const UNREACHABLE_PROXY = "http://127.0.0.1:9";

// Sends every request that isn't for the target to a proxy that refuses it. Routing could block
// them too, but while any route is registered Playwright reports a request a service worker answers
// (an msw mock, say) only once its response is ready, which hides it from the settle wait for as
// long as the mocked delay lasts. Firefox can't bypass a single port, so it can still reach other
// localhost ports, but every other host is blocked there too.
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
