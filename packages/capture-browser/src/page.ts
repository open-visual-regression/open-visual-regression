import type { Browser, BrowserContextOptions, Page, Request } from "playwright";

import { isAllowedHost, toProxyBypass, type AllowedHost, type BrowserEngine } from "./allowedHosts";
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
// it has a response, so settling would not wait for it. The proxy also catches what a service
// worker fetches itself, which page.route never saw. Allowed hosts bypass the proxy, so they load
// like the capture origin, for the page and its service workers alike. Firefox can't exclude a
// single port from the proxy, so other localhost ports stay reachable there.
export const blockExternalRequests = (
  browser: Browser,
  origin: string,
  allowedHosts: readonly AllowedHost[] = [],
): Pick<BrowserContextOptions, "proxy"> => {
  const { host, hostname } = new URL(origin);
  const engine = browser.browserType().name() as BrowserEngine;
  const target = engine === "firefox" ? [hostname] : ["<-loopback>", host];
  const bypass = [...target, ...toProxyBypass(engine, allowedHosts)].join(",");

  return { proxy: { server: UNREACHABLE_PROXY, bypass } };
};

const BLOCKABLE_PROTOCOLS = new Set(["http:", "https:", "ws:", "wss:"]);

export type BlockedHosts = {
  // The hosts blocked since the last call, so each snapshot reports its own.
  take: () => string[];
  dispose: () => void;
};

// The refusing proxy only surfaces as a generic network error, so a failed request to a host
// that isn't allowed is reported as blocked. Listens on the context so requests a service worker
// makes are seen where the browser reports them.
export const trackBlockedHosts = (
  page: Page,
  origin: string,
  allowedHosts: readonly AllowedHost[] = [],
): BlockedHosts => {
  const { host: originHost } = new URL(origin);
  const context = page.context();
  let blocked = new Set<string>();

  const onRequestFailed = (request: Request) => {
    let url: URL;
    try {
      url = new URL(request.url());
    } catch {
      return;
    }
    if (
      BLOCKABLE_PROTOCOLS.has(url.protocol) &&
      url.host !== originHost &&
      !isAllowedHost(url, allowedHosts)
    ) {
      blocked.add(url.host);
    }
  };

  context.on("requestfailed", onRequestFailed);

  return {
    take: () => {
      const hosts = [...blocked].sort();
      blocked = new Set();
      return hosts;
    },
    dispose: () => {
      context.off("requestfailed", onRequestFailed);
    },
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
