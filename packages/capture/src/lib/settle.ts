import type { Page, Request } from "playwright";

import { NETWORK_QUIET_WINDOW_MS, SETTLE_TIMEOUT_MS } from "./captureTimeouts";

const MIN_PAINT_BUDGET_MS = 250;

export type NetworkActivity = {
  whenQuiet: (quietWindowMs: number, timeoutMs: number) => Promise<boolean>;
  dispose: () => void;
};

export const trackNetworkActivity = (
  page: Page,
  abandonAfterMs = SETTLE_TIMEOUT_MS,
): NetworkActivity => {
  const pending = new Map<Request, ReturnType<typeof setTimeout>>();
  const listeners = new Set<() => void>();

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

export const settlePage = async (
  page: Page,
  activity: NetworkActivity,
  timeoutMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  const quiet = await activity.whenQuiet(NETWORK_QUIET_WINDOW_MS, timeoutMs);

  const painted = await page.evaluate(waitForPaint, {
    timeoutMs: Math.max(deadline - Date.now(), MIN_PAINT_BUDGET_MS),
  });

  return quiet && painted;
};
