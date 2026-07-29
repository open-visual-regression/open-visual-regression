import type { BrowserContext, Page } from "playwright";

// Capture only ever loads one trusted local proxy origin per page (see the
// page.route allowlist in snapshots.ts/storyViewports.ts), so Chromium's
// Site Isolation - which exists to sandbox untrusted cross-origin content
// from itself - buys nothing here and just spawns extra renderer/GPU
// processes to compete for CPU on the capture worker's constrained node.
export const CHROMIUM_LAUNCH_ARGS = [
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-features=IsolateOrigins,site-per-process",
  "--disable-site-isolation-trials",
];

export const newPage = async (context: BrowserContext): Promise<Page> => {
  const page = await context.newPage();
  // tsx's esbuild keepNames wraps functions with __name(), which leaks into
  // page.evaluate sources. Define it so the browser doesn't throw.
  await page.addInitScript({ content: "globalThis.__name ??= (value) => value;" });
  return page;
};
