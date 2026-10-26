import type { ChildProcess } from "node:child_process";

import type {
  Browser,
  BrowserContext,
  BrowserServer,
  BrowserType,
  LaunchOptions,
  Page,
} from "playwright";

import { listProcessFamily } from "./processTree";
import {
  BROWSER_CLOSE_TIMEOUT_MS,
  BROWSER_CONNECT_TIMEOUT_MS,
  BROWSER_KILL_TIMEOUT_MS,
  CONTEXT_CLOSE_TIMEOUT_MS,
} from "./timeouts";

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

/** A step of closing a browser that can run out of time. */
export type BrowserCloseStep = "context" | "browser" | "kill";

export type ManagedBrowser = {
  browser: Browser;
  /**
   * Closes the browser's contexts, then the browser, then kills whatever is left of its process
   * tree. Never rejects, settles within the sum of the close timeouts, and resolves with the steps
   * that ran out of time: one that includes "kill" means browser processes may still be running.
   * Calling it again returns the same promise.
   */
  close: () => Promise<BrowserCloseStep[]>;
};

const KILL_POLL_INTERVAL_MS = 50;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Whether the work settled, either way, before the timeout.
const settlesWithin = async (work: () => Promise<unknown>, timeoutMs: number): Promise<boolean> => {
  let deadlineHandle: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<false>((resolve) => {
    deadlineHandle = setTimeout(() => resolve(false), timeoutMs);
  });
  const settled = Promise.resolve()
    .then(work)
    .then(
      () => true,
      () => true,
    );

  try {
    return await Promise.race([settled, deadline]);
  } finally {
    clearTimeout(deadlineHandle);
  }
};

const hasExited = (child: ChildProcess): boolean =>
  child.exitCode !== null || child.signalCode !== null;

const sendKill = (pid: number): void => {
  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // Already gone.
  }
};

// Playwright spawns the browser as the leader of its own process group, so signalling the group
// reaches the launcher script and every browser process under it, even ones whose parent exited.
const killProcessFamily = async (server: BrowserServer): Promise<boolean> => {
  const child = server.process();
  const pid = child.pid;
  if (pid === undefined) {
    return true;
  }

  if (process.platform === "win32") {
    return settlesWithin(() => server.kill(), BROWSER_KILL_TIMEOUT_MS);
  }

  const deadline = Date.now() + BROWSER_KILL_TIMEOUT_MS;
  for (;;) {
    // Without /proc, only the launched process can be waited for.
    const family = (await listProcessFamily(pid)) ?? (hasExited(child) ? [] : [pid]);
    if (family.length === 0) {
      return true;
    }
    if (Date.now() >= deadline) {
      return false;
    }

    sendKill(-pid);
    for (const member of family) {
      sendKill(member);
    }
    await sleep(KILL_POLL_INTERVAL_MS);
  }
};

const closeBrowser = async (
  server: BrowserServer,
  browser: Browser | undefined,
): Promise<BrowserCloseStep[]> => {
  const timedOut: BrowserCloseStep[] = [];

  // Closing the pages first stops the story's scripts even if the browser process lingers.
  const contexts = browser?.contexts() ?? [];
  const contextsClosed = await settlesWithin(
    () => Promise.all(contexts.map((context) => context.close())),
    CONTEXT_CLOSE_TIMEOUT_MS,
  );
  if (!contextsClosed) {
    timedOut.push("context");
  }

  if (!(await settlesWithin(() => server.close(), BROWSER_CLOSE_TIMEOUT_MS))) {
    timedOut.push("browser");
  }

  if (!(await killProcessFamily(server))) {
    timedOut.push("kill");
  }

  // The browser is gone by now, so this only drops this side of the connection.
  browser?.close().catch(() => undefined);

  return timedOut;
};

/**
 * Launches a browser whose processes can be killed if it doesn't close, which `launch()` can't
 * offer since it doesn't expose the browser's process.
 */
export const launchBrowser = async (
  browserType: BrowserType,
  options: LaunchOptions = {},
): Promise<ManagedBrowser> => {
  const server = await browserType.launchServer({
    ...SIGNAL_HANDLING_OPTIONS,
    ...options,
    // Anything that can reach the server controls the browser, so keep it off the network.
    host: "127.0.0.1",
  });

  let browser: Browser;
  try {
    browser = await browserType.connect(server.wsEndpoint(), {
      timeout: BROWSER_CONNECT_TIMEOUT_MS,
    });
  } catch (error) {
    await closeBrowser(server, undefined);
    throw error;
  }

  let closing: Promise<BrowserCloseStep[]> | undefined;
  return {
    browser,
    close: () => (closing ??= closeBrowser(server, browser)),
  };
};
