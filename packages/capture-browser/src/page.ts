import type { Page } from "playwright";

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

export const blockExternalRequests = async (page: Page, origin: string): Promise<void> => {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin || url.protocol === "data:" || url.protocol === "blob:") {
      return route.continue();
    }
    return route.abort();
  });
};

// A lazy image or iframe outside the viewport only loads once it is scrolled into view, which for
// a full-page screenshot can happen partway through taking it. Loading them eagerly, including ones
// a story adds later, means they load while the page settles instead.
const watchForLazyResources = (): void => {
  const LAZY_SELECTOR = 'img[loading="lazy"], iframe[loading="lazy"]';

  const makeEager = (node: Node) => {
    if (!(node instanceof Element)) {
      return;
    }
    if (node.matches(LAZY_SELECTOR)) {
      node.setAttribute("loading", "eager");
    }
    for (const element of node.querySelectorAll(LAZY_SELECTOR)) {
      element.setAttribute("loading", "eager");
    }
  };

  new MutationObserver((records) => {
    for (const record of records) {
      makeEager(record.target);
      for (const added of record.addedNodes) {
        makeEager(added);
      }
    }
  }).observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["loading"],
  });
};

export const disableLazyLoading = async (page: Page): Promise<void> => {
  await page.addInitScript(watchForLazyResources);
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
