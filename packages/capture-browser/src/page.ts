import type { Browser, BrowserContextOptions, Page, Request } from "playwright";

import { isAllowedUrl, toProxyBypass } from "./allowedHosts";
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
  allowlist: readonly string[] | null,
): Pick<BrowserContextOptions, "proxy"> => {
  if (allowlist === null) {
    return {};
  }

  const { host, hostname } = new URL(origin);
  const browserName = browser.browserType().name();
  const target = browserName === "firefox" ? [hostname] : ["<-loopback>", host];
  const bypass = [...target, ...toProxyBypass(browserName, allowlist)].join(",");

  return { proxy: { server: UNREACHABLE_PROXY, bypass } };
};

export type BlockedHosts = {
  // Hosts blocked since the last call.
  take: () => string[];
  dispose: () => void;
};

// A blocked request only fails with a generic network error, so report the host of any failed
// request that isn't allowed.
export const trackBlockedHosts = (
  page: Page,
  origin: string,
  allowlist: readonly string[] | null,
): BlockedHosts => {
  if (allowlist === null) {
    return { take: () => [], dispose: () => {} };
  }

  const { host: originHost } = new URL(origin);
  const context = page.context();
  let blocked = new Set<string>();

  const onRequestFailed = (request: Request) => {
    const url = new URL(request.url());
    if (
      url.protocol.startsWith("http") &&
      url.host !== originHost &&
      !isAllowedUrl(url, allowlist)
    ) {
      blocked.add(url.host);
    }
  };

  // The context also sees requests a service worker makes.
  context.on("requestfailed", onRequestFailed);

  return {
    take: () => {
      const hosts = [...blocked].sort();
      blocked = new Set();
      return hosts;
    },
    dispose: () => context.off("requestfailed", onRequestFailed),
  };
};

// A lazy image below the viewport would otherwise load partway through a full-page screenshot.
const loadLazyResourcesEagerly = (): void => {
  const lazySelector = 'img[loading="lazy"], iframe[loading="lazy"]';

  const makeEager = (node: Node) => {
    if (!(node instanceof Element)) {
      return;
    }
    if (node.matches(lazySelector)) {
      node.setAttribute("loading", "eager");
    }
    for (const element of node.querySelectorAll(lazySelector)) {
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
  await page.addInitScript(loadLazyResourcesEagerly);
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
