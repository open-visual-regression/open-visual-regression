import { existsSync } from "node:fs";

import { chromium, firefox, webkit, type BrowserServer, type BrowserType } from "playwright";
import { vi } from "vitest";

import { launchBrowser } from "../browser";
import { listProcessFamily } from "../processTree";
import { describe, expect, test } from "./fixtures";

const { CONTEXT_CLOSE_TIMEOUT_MS, BROWSER_CLOSE_TIMEOUT_MS, BROWSER_KILL_TIMEOUT_MS } = vi.hoisted(
  () => ({
    CONTEXT_CLOSE_TIMEOUT_MS: 500,
    BROWSER_CLOSE_TIMEOUT_MS: 1_000,
    BROWSER_KILL_TIMEOUT_MS: 5_000,
  }),
);

vi.mock("../timeouts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../timeouts")>()),
  CONTEXT_CLOSE_TIMEOUT_MS,
  BROWSER_CLOSE_TIMEOUT_MS,
  BROWSER_KILL_TIMEOUT_MS,
}));

const CLOSE_BOUND_MS =
  CONTEXT_CLOSE_TIMEOUT_MS + BROWSER_CLOSE_TIMEOUT_MS + BROWSER_KILL_TIMEOUT_MS;

const never = () => new Promise<never>(() => {});

// Each browser runs where it is installed: CI installs Chromium only.
const BROWSER_TYPES = [chromium, firefox, webkit].map((browserType) => ({
  name: browserType.name(),
  browserType,
  installed: existsSync(browserType.executablePath()),
}));

const spyOnServers = (browserType: BrowserType, onLaunch?: (server: BrowserServer) => void) => {
  const launchServer = browserType.launchServer.bind(browserType);
  const servers: BrowserServer[] = [];
  vi.spyOn(browserType, "launchServer").mockImplementation(async (options) => {
    const server = await launchServer(options);
    onLaunch?.(server);
    servers.push(server);
    return server;
  });
  return servers;
};

const processesOf = async (server: BrowserServer): Promise<number[]> =>
  (await listProcessFamily(server.process().pid!)) ?? [];

describe.each(BROWSER_TYPES)("launchBrowser ($name)", ({ browserType, installed }) => {
  test.skipIf(!installed)("closes a browser and every one of its processes", async () => {
    const servers = spyOnServers(browserType);
    const { browser, close } = await launchBrowser(browserType);
    const page = await browser.newPage();
    await page.setContent("<p>story</p>");
    expect((await processesOf(servers[0]!)).length).toBeGreaterThan(0);

    expect(await close()).toEqual([]);

    expect(await processesOf(servers[0]!)).toEqual([]);
    expect(browser.isConnected()).toBe(false);
  });

  test.skipIf(!installed)(
    "kills a browser whose pages and process never close, within its time limit",
    async () => {
      const servers = spyOnServers(browserType, (server) => {
        server.close = never;
      });
      const { browser, close } = await launchBrowser(browserType);
      const context = await browser.newContext();
      context.close = never;
      const page = await context.newPage();
      // Keeps the page busy the way an animated story does.
      await page.setContent(
        "<script>setInterval(() => { document.title = Date.now(); }, 10)</script>",
      );

      const start = performance.now();
      const timedOutSteps = await close();

      expect(timedOutSteps).toEqual(["context", "browser"]);
      expect(performance.now() - start).toBeLessThan(CLOSE_BOUND_MS);
      expect(await processesOf(servers[0]!)).toEqual([]);
    },
  );

  test.skipIf(!installed)("kills a browser whose page is stuck in a busy loop", async () => {
    const servers = spyOnServers(browserType, (server) => {
      server.close = never;
    });
    const { browser, close } = await launchBrowser(browserType);
    const page = await browser.newPage();
    await page.evaluate(() => {
      setTimeout(() => {
        // oxlint-disable-next-line no-constant-condition
        while (true) {}
      });
    });

    const timedOutSteps = await close();

    expect(timedOutSteps).toContain("browser");
    expect(timedOutSteps).not.toContain("kill");
    expect(await processesOf(servers[0]!)).toEqual([]);
  });

  test.skipIf(!installed)("returns the same close to every caller", async () => {
    const { close } = await launchBrowser(browserType);

    expect(close()).toBe(close());
    await close();
  });
});
