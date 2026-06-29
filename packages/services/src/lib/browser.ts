import type { BrowserContext, Page } from "playwright";

// Functions handed to `page.evaluate` are sent to the browser as `fn.toString()`,
// so they carry whatever helpers our bundler injected into the source. The dev
// runtime (tsx) runs esbuild with `keepNames` on and wraps functions as
// `__name(fn, "fn")`; that helper only exists in the Node scope, so the browser
// throws `__name is not defined`. The prod build (tsup) emits no such helper, so
// the `??=` here is a harmless no-op there — dev and prod end up with identical
// browser behavior. Every page must come from `newPage` so this prelude is never
// the thing a new call site forgets.
const EVALUATE_HELPER_PRELUDE = "globalThis.__name ??= (value) => value;";

export const newPage = async (context: BrowserContext): Promise<Page> => {
  const page = await context.newPage();
  await page.addInitScript({ content: EVALUATE_HELPER_PRELUDE });
  return page;
};
