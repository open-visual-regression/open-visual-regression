import { chromium, firefox, webkit, type Browser } from "playwright";

import { SIGNAL_HANDLING_OPTIONS } from "@ovr/capture-browser/browser";
import { createLogger } from "@ovr/logger";

const logger = createLogger("capture");

const BROWSER_LAUNCHERS = { chromium, firefox, webkit };

const getBrowserLauncher = (browser: string) => {
  const launcher = BROWSER_LAUNCHERS[browser as keyof typeof BROWSER_LAUNCHERS];
  if (!launcher) {
    throw new Error(`Unsupported browser: ${browser}`);
  }
  return launcher;
};

const launched = new Map<string, Promise<Browser>>();
const closing = new Set<Browser>();

const launchBrowser = async (browserName: string): Promise<Browser> => {
  const browser = await getBrowserLauncher(browserName).launch({
    ...SIGNAL_HANDLING_OPTIONS,
    ...(browserName === "chromium" ? { args: ["--disable-dev-shm-usage"] } : {}),
  });

  browser.on("disconnected", () => {
    if (closing.delete(browser)) {
      return;
    }
    logger.error({ browser: browserName }, "capture browser disconnected unexpectedly");
  });

  return browser;
};

export const acquireBrowser = async (browserName: string): Promise<Browser> => {
  const existing = launched.get(browserName);
  if (existing) {
    const browser = await existing.catch(() => undefined);
    if (browser?.isConnected()) {
      return browser;
    }
    if (launched.get(browserName) === existing) {
      launched.delete(browserName);
    }
    return acquireBrowser(browserName);
  }

  const launching = launchBrowser(browserName);
  launched.set(browserName, launching);
  return launching;
};

export const closeBrowsers = async (): Promise<void> => {
  const browsers = await Promise.all(
    Array.from(launched.values(), (launching) => launching.catch(() => undefined)),
  );
  launched.clear();

  await Promise.all(
    browsers.map(async (browser) => {
      if (!browser?.isConnected()) {
        return;
      }
      closing.add(browser);
      await browser.close();
    }),
  );
};
