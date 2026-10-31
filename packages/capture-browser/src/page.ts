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

// "auto" only checks pages that can change pixels without changing the DOM, which settlePage
// can't see; "always" checks every page.
export type StabilityMode = "off" | "auto" | "always";

export type StableScreenshot = {
  image: Buffer;
  // How many screenshots were taken.
  screenshots: number;
  // Whether two screenshots in a row matched. Only false when the page was checked and never
  // stopped changing within the budget.
  stable: boolean;
};

// Waits between screenshots. Shorter than Playwright's 100, 250, 500, then 1000ms, because a
// typical chart animation ends within a second and a long final wait only adds latency.
const STABILITY_INTERVALS_MS = [100, 250, 250, 250, 500];
const STABILITY_REPEAT_INTERVAL_MS = 1_000;
export const STABILITY_TIMEOUT_MS = 2_000;
// Bounds the screenshots a page that never stops changing costs on every build.
export const MAX_STABILITY_SCREENSHOTS = 6;

// Content that can repaint without a DOM mutation: canvas and video draw on their own, an
// iframe's document and a shadow root aren't seen by settlePage's MutationObserver, SVG
// animations aren't stopped by `animations: "disabled"`, and animated images keep playing.
const mayRepaintWithoutMutation = (): boolean => {
  const repaintsOnItsOwn =
    "canvas, video, iframe, embed, object, animate, animateMotion, animateTransform, set";
  if (document.querySelector(repaintsOnItsOwn)) {
    return true;
  }

  const animatedImage = /\.(gif|webp|apng)([?#]|$)/i;
  for (const image of document.images) {
    if (animatedImage.test(image.currentSrc)) {
      return true;
    }
  }

  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if ((node as Element).shadowRoot) {
      return true;
    }
  }
  return false;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Takes screenshots until two in a row match, so a frame caught mid-animation isn't kept. The
// first screenshot is the one that would have been taken anyway, so a stable page costs one wait
// and one extra screenshot. A page that never stops changing within `timeoutMs` keeps its last
// screenshot and reports `stable: false`.
export const takeStableScreenshot = async (
  page: Page,
  fullPage: boolean,
  { mode, timeoutMs = STABILITY_TIMEOUT_MS }: { mode: StabilityMode; timeoutMs?: number },
): Promise<StableScreenshot> => {
  const first = await takeScreenshot(page, fullPage);
  if (mode === "off" || (mode === "auto" && !(await page.evaluate(mayRepaintWithoutMutation)))) {
    return { image: first, screenshots: 1, stable: true };
  }

  const deadline = Date.now() + timeoutMs;
  let previous = first;
  for (let attempt = 0; ; attempt++) {
    const interval = STABILITY_INTERVALS_MS[attempt] ?? STABILITY_REPEAT_INTERVAL_MS;
    const remaining = deadline - Date.now();
    if (remaining <= 0 || attempt + 1 >= MAX_STABILITY_SCREENSHOTS) {
      return { image: previous, screenshots: attempt + 1, stable: false };
    }
    await sleep(Math.min(interval, remaining));

    const next = await takeScreenshot(page, fullPage);
    if (next.equals(previous)) {
      return { image: next, screenshots: attempt + 2, stable: true };
    }
    previous = next;
  }
};
