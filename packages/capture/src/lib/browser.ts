import type { BrowserContext, LaunchOptions, Page } from "playwright";

export const SIGNAL_HANDLING_OPTIONS: LaunchOptions = {
  handleSIGINT: false,
  handleSIGTERM: false,
  handleSIGHUP: false,
};

export const newPage = async (context: BrowserContext): Promise<Page> => {
  const page = await context.newPage();
  // tsx's esbuild keepNames wraps functions with __name(), which leaks into
  // page.evaluate sources. Define it so the browser doesn't throw.
  await page.addInitScript({ content: "globalThis.__name ??= (value) => value;" });
  return page;
};
