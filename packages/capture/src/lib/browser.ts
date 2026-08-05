import type { BrowserContext, LaunchOptions, Page } from "playwright";

// Playwright kills every launched browser from its own signal handlers, racing the
// worker's graceful drain. Disable them so the worker owns shutdown ordering.
export const SIGNAL_HANDLING_OPTIONS = {
  handleSIGINT: false,
  handleSIGTERM: false,
  handleSIGHUP: false,
} satisfies LaunchOptions;

export const newPage = async (context: BrowserContext): Promise<Page> => {
  const page = await context.newPage();
  // tsx's esbuild keepNames wraps functions with __name(), which leaks into
  // page.evaluate sources. Define it so the browser doesn't throw.
  await page.addInitScript({ content: "globalThis.__name ??= (value) => value;" });
  return page;
};
