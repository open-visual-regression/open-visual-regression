import type { Page, Request } from "playwright";

import { NETWORK_QUIET_WINDOW_MS } from "./captureTimeouts";

const POLL_INTERVAL_MS = 25;

const MIN_PAINT_BUDGET_MS = 250;

export type NetworkActivity = {
  pending: (staleAfterMs: number) => number;
  dispose: () => void;
};

export const trackNetworkActivity = (page: Page): NetworkActivity => {
  const startedAt = new Map<Request, number>();

  const add = (request: Request) => startedAt.set(request, Date.now());
  const remove = (request: Request) => startedAt.delete(request);

  page.on("request", add);
  page.on("requestfinished", remove);
  page.on("requestfailed", remove);

  return {
    pending: (staleAfterMs) => {
      const cutoff = Date.now() - staleAfterMs;
      let pending = 0;
      for (const start of startedAt.values()) {
        if (start > cutoff) {
          pending += 1;
        }
      }
      return pending;
    },
    dispose: () => {
      page.off("request", add);
      page.off("requestfinished", remove);
      page.off("requestfailed", remove);
      startedAt.clear();
    },
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type NetworkQuietOptions = { quietWindowMs: number; staleAfterMs: number; deadline: number };

const waitForNetworkQuiet = async (
  activity: NetworkActivity,
  { quietWindowMs, staleAfterMs, deadline }: NetworkQuietOptions,
): Promise<boolean> => {
  let quietSince: number | undefined;

  for (;;) {
    const now = Date.now();

    if (activity.pending(staleAfterMs) === 0) {
      quietSince ??= now;
      if (now - quietSince >= quietWindowMs) {
        return true;
      }
    } else {
      quietSince = undefined;
    }

    if (now >= deadline) {
      return false;
    }

    await sleep(POLL_INTERVAL_MS);
  }
};

const waitForPaint = ({ timeoutMs }: { timeoutMs: number }): Promise<boolean> =>
  new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), timeoutMs);

    const paint = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          clearTimeout(timeout);
          resolve(true);
        }),
      );

    // document.fonts.ready only resolves once the document itself has loaded, so
    // a request that never finishes would otherwise hold back every paint.
    const fontsDeadline = setTimeout(paint, Math.floor(timeoutMs / 2));

    const afterFonts = () => {
      clearTimeout(fontsDeadline);
      paint();
    };

    Promise.resolve(document.fonts?.ready).then(afterFonts, afterFonts);
  });

export const settlePage = async (
  page: Page,
  activity: NetworkActivity,
  timeoutMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  const quiet = await waitForNetworkQuiet(activity, {
    quietWindowMs: NETWORK_QUIET_WINDOW_MS,
    staleAfterMs: timeoutMs,
    deadline,
  });

  const painted = await page.evaluate(waitForPaint, {
    timeoutMs: Math.max(deadline - Date.now(), MIN_PAINT_BUDGET_MS),
  });

  return quiet && painted;
};
