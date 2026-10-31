import type { Page, Request } from "playwright";

import {
  DOM_QUIET_WINDOW_MS,
  DOM_SETTLE_TIMEOUT_MS,
  NETWORK_QUIET_WINDOW_MS,
  SETTLE_TIMEOUT_MS,
} from "./timeouts";

const MIN_PAINT_BUDGET_MS = 250;

export type NetworkActivity = {
  // How long a request or image can stay pending before it's given up on.
  abandonAfterMs: number;
  whenQuiet: (quietWindowMs: number, timeoutMs: number) => Promise<boolean>;
  requestCount: () => number;
  dispose: () => void;
};

type DocumentWatch = { observer: MutationObserver; lastMutationAt: number };

type LoadingImage = { src: string; since: number };

declare global {
  var __OVR_DOCUMENT_WATCH__: DocumentWatch | undefined;
  var __OVR_LOADING_IMAGES__: WeakMap<HTMLImageElement, LoadingImage> | undefined;
}

export const trackNetworkActivity = (
  page: Page,
  abandonAfterMs = SETTLE_TIMEOUT_MS,
): NetworkActivity => {
  const pending = new Map<Request, ReturnType<typeof setTimeout>>();
  const listeners = new Set<() => void>();
  let requestCount = 0;

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const remove = (request: Request) => {
    const abandon = pending.get(request);
    if (abandon === undefined) {
      return;
    }
    clearTimeout(abandon);
    pending.delete(request);
    notify();
  };

  // A request that outlives a whole settle budget is treated as abandoned, so one
  // response that never arrives cannot stall every later snapshot on this page.
  const add = (request: Request) => {
    requestCount += 1;
    pending.set(
      request,
      setTimeout(() => remove(request), abandonAfterMs),
    );
    notify();
  };

  page.on("request", add);
  page.on("requestfinished", remove);
  page.on("requestfailed", remove);

  return {
    abandonAfterMs,
    whenQuiet: (quietWindowMs, timeoutMs) =>
      new Promise((resolve) => {
        let quietTimer: ReturnType<typeof setTimeout> | undefined;

        const finish = (quiet: boolean) => {
          clearTimeout(quietTimer);
          clearTimeout(expiry);
          listeners.delete(onChange);
          resolve(quiet);
        };

        const onChange = () => {
          clearTimeout(quietTimer);
          if (pending.size === 0) {
            quietTimer = setTimeout(() => finish(true), quietWindowMs);
          }
        };

        const expiry = setTimeout(() => finish(false), timeoutMs);

        listeners.add(onChange);
        onChange();
      }),
    requestCount: () => requestCount,
    dispose: () => {
      page.off("request", add);
      page.off("requestfinished", remove);
      page.off("requestfailed", remove);
      for (const abandon of pending.values()) {
        clearTimeout(abandon);
      }
      pending.clear();
      listeners.clear();
    },
  };
};

const waitForPaint = ({ timeoutMs }: { timeoutMs: number }): Promise<boolean> => {
  const elapsed = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const nextPaint = () =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

  // document.fonts.ready only resolves once the document itself has loaded, so a
  // request that never finishes would otherwise hold back every paint.
  const fonts = Promise.resolve(document.fonts?.ready).then(
    () => undefined,
    () => undefined,
  );

  return Promise.race([
    Promise.race([fonts, elapsed(timeoutMs / 2)])
      .then(nextPaint)
      .then(() => true),
    elapsed(timeoutMs).then(() => false),
  ]);
};

const watchDocument = (): void => {
  globalThis.__OVR_DOCUMENT_WATCH__?.observer.disconnect();

  const watch: DocumentWatch = {
    observer: new MutationObserver(() => {
      watch.lastMutationAt = performance.now();
    }),
    lastMutationAt: performance.now(),
  };

  watch.observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });
  globalThis.__OVR_DOCUMENT_WATCH__ = watch;

  // Starts the clock on images already loading, so one that never finishes is given up on in time.
  const loadingSince = (globalThis.__OVR_LOADING_IMAGES__ ??= new WeakMap());
  for (const image of document.images) {
    if (!image.complete && loadingSince.get(image)?.src !== image.currentSrc) {
      loadingSince.set(image, { src: image.currentSrc, since: watch.lastMutationAt });
    }
  }
};

const unwatchDocument = (): void => {
  globalThis.__OVR_DOCUMENT_WATCH__?.observer.disconnect();
  globalThis.__OVR_DOCUMENT_WATCH__ = undefined;
};

// Waits for every image to load and decode, and for fonts to load. An image can still be loading
// after the network goes quiet, because the browser hasn't sent its request yet or hasn't handled
// the response yet, so it's waited for here rather than left to the network tracker.
const waitForImagesAndFonts = ({
  timeoutMs,
  abandonAfterMs,
}: {
  timeoutMs: number;
  abandonAfterMs: number;
}): Promise<boolean> => {
  const elapsed = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  const now = performance.now();

  // Like a stuck request, an image that outlives a whole settle budget is given up on, so it
  // cannot stall every later snapshot on this page.
  const loadingSince = (globalThis.__OVR_LOADING_IMAGES__ ??= new WeakMap());
  const isAbandoned = (image: HTMLImageElement) => {
    const loading = loadingSince.get(image);
    if (loading?.src !== image.currentSrc) {
      loadingSince.set(image, { src: image.currentSrc, since: now });
      return false;
    }
    return now - loading.since >= abandonAfterMs;
  };

  const loaded = (image: HTMLImageElement) =>
    new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });

  // An image still marked lazy is outside the viewport, so it won't load for the screenshot.
  const images = Array.from(document.images)
    .filter((image) => image.complete || (image.loading !== "lazy" && !isAbandoned(image)))
    .map((image) =>
      (image.complete ? Promise.resolve() : loaded(image))
        .then(() => image.decode())
        .catch(() => undefined),
    );

  const fonts = Promise.resolve(
    document.fonts?.status === "loading" ? document.fonts.ready : undefined,
  ).catch(() => undefined);

  return Promise.race([
    Promise.all([...images, fonts]).then(() => true),
    elapsed(timeoutMs).then(() => false),
  ]);
};

const waitForQuietDom = async ({
  quietWindowMs,
  timeoutMs,
}: {
  quietWindowMs: number;
  timeoutMs: number;
}): Promise<boolean> => {
  const deadline = performance.now() + timeoutMs;
  const remaining = () => deadline - performance.now();
  const elapsed = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  // The watch is gone if the page navigated, which counts as a change.
  const lastMutationAt = () =>
    globalThis.__OVR_DOCUMENT_WATCH__?.lastMutationAt ?? performance.now();

  let quietFor = performance.now() - lastMutationAt();
  while (quietFor < quietWindowMs) {
    if (remaining() <= 0) {
      return false;
    }
    await elapsed(Math.min(quietWindowMs - quietFor, remaining()));
    quietFor = performance.now() - lastMutationAt();
  }
  return true;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Rendering can come in waves, so the network, images, and DOM have to be quiet in the same pass.
// A DOM that never stops changing, like an endless animation, is only watched for a while, but its
// requests and images are still waited for. Resolves with whether everything, the DOM included,
// went quiet.
const waitForQuietPage = async (
  page: Page,
  activity: NetworkActivity,
  deadline: number,
): Promise<boolean> => {
  let watchDom = true;

  for (;;) {
    const quiet = await activity.whenQuiet(NETWORK_QUIET_WINDOW_MS, deadline - Date.now());
    if (!quiet) {
      return false;
    }

    const requestCount = activity.requestCount();
    const mutationsBefore = await page.evaluate(
      () => globalThis.__OVR_DOCUMENT_WATCH__?.lastMutationAt,
    );

    const loaded = await page.evaluate(waitForImagesAndFonts, {
      timeoutMs: deadline - Date.now(),
      abandonAfterMs: activity.abandonAfterMs,
    });
    if (!loaded) {
      return false;
    }

    let domChanged = false;
    if (watchDom) {
      const domQuiet = await page.evaluate(waitForQuietDom, {
        quietWindowMs: DOM_QUIET_WINDOW_MS,
        timeoutMs: Math.max(Math.min(deadline - Date.now(), DOM_SETTLE_TIMEOUT_MS), 0),
      });
      if (!domQuiet) {
        if (Date.now() >= deadline) {
          return false;
        }
        watchDom = false;
        continue;
      }
      // The DOM changed while images loaded, so there may be new ones.
      domChanged =
        (await page.evaluate(() => globalThis.__OVR_DOCUMENT_WATCH__?.lastMutationAt)) !==
        mutationsBefore;
    } else {
      // Gives the render a moment to start any requests it has left.
      await sleep(Math.min(DOM_QUIET_WINDOW_MS, Math.max(deadline - Date.now(), 0)));
    }

    if (activity.requestCount() === requestCount && !domChanged) {
      return watchDom;
    }
  }
};

export const settlePage = async (
  page: Page,
  activity: NetworkActivity,
  timeoutMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  await page.evaluate(watchDocument);

  try {
    const quiet = await waitForQuietPage(page, activity, deadline);

    const painted = await page.evaluate(waitForPaint, {
      timeoutMs: Math.max(deadline - Date.now(), MIN_PAINT_BUDGET_MS),
    });

    return quiet && painted;
  } finally {
    await page.evaluate(unwatchDocument).catch(() => undefined);
  }
};
