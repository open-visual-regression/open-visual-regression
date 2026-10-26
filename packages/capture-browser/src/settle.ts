import type { Page, Request } from "playwright";

import {
  DOM_QUIET_WINDOW_MS,
  DOM_SETTLE_TIMEOUT_MS,
  NETWORK_QUIET_WINDOW_MS,
  SETTLE_TIMEOUT_MS,
} from "./timeouts";

const MIN_PAINT_BUDGET_MS = 250;

export type NetworkActivity = {
  whenQuiet: (quietWindowMs: number, timeoutMs: number) => Promise<boolean>;
  requestCount: () => number;
  dispose: () => void;
};

type DocumentWatch = { observer: MutationObserver; lastMutationAt: number };

declare global {
  var __OVR_DOCUMENT_WATCH__: DocumentWatch | undefined;
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
};

const unwatchDocument = (): void => {
  globalThis.__OVR_DOCUMENT_WATCH__?.observer.disconnect();
  globalThis.__OVR_DOCUMENT_WATCH__ = undefined;
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

  // Images still loading are left to the network tracker, which gives up on a stuck request.
  const imagesDecoded = () =>
    Promise.all(
      Array.from(document.images)
        .filter((image) => image.complete)
        .map((image) => image.decode().catch(() => undefined)),
    );

  while (remaining() > 0) {
    const scannedAt = lastMutationAt();

    const decoded = await Promise.race([
      imagesDecoded().then(() => true),
      elapsed(remaining()).then(() => false),
    ]);
    if (!decoded) {
      return false;
    }

    let quietFor = performance.now() - lastMutationAt();
    while (quietFor < quietWindowMs) {
      if (remaining() <= 0) {
        return false;
      }
      await elapsed(Math.min(quietWindowMs - quietFor, remaining()));
      quietFor = performance.now() - lastMutationAt();
    }

    // The DOM changed while decoding, so there may be new images.
    if (lastMutationAt() === scannedAt) {
      return true;
    }
  }

  return false;
};

// Rendering can come in waves, so the network and the DOM have to be quiet in the same pass.
const waitForQuietPage = async (
  page: Page,
  activity: NetworkActivity,
  deadline: number,
): Promise<boolean> => {
  for (;;) {
    const quiet = await activity.whenQuiet(NETWORK_QUIET_WINDOW_MS, deadline - Date.now());
    if (!quiet) {
      return false;
    }

    const requestCount = activity.requestCount();
    const domQuiet = await page.evaluate(waitForQuietDom, {
      quietWindowMs: DOM_QUIET_WINDOW_MS,
      timeoutMs: Math.min(deadline - Date.now(), DOM_SETTLE_TIMEOUT_MS),
    });
    if (!domQuiet) {
      return false;
    }

    if (activity.requestCount() === requestCount) {
      return true;
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
