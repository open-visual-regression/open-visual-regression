import { existsSync } from "node:fs";

import { chromium, firefox, webkit, type BrowserServer, type BrowserType } from "playwright";
import { vi } from "vitest";

import { launchBrowser } from "../browser";
import { listProcessFamily } from "../processTree";
import { describe, expect, test } from "./fixtures";

vi.mock("../timeouts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../timeouts")>()),
  CONTEXT_CLOSE_TIMEOUT_MS: 500,
  BROWSER_CLOSE_TIMEOUT_MS: 1_000,
}));

// CI installs Chromium only.
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
  test.skipIf(!installed)("closes the browser and all of its processes", async () => {
    const servers = spyOnServers(browserType);
    const { browser, close } = await launchBrowser(browserType);
    await browser.newPage();

    expect(await close()).toEqual([]);
    expect(await processesOf(servers[0]!)).toEqual([]);
  });

  test.skipIf(!installed)("kills a browser stuck in a story that never closes", async () => {
    const servers = spyOnServers(browserType, (server) => {
      server.close = () => new Promise(() => {});
    });
    const { browser, close } = await launchBrowser(browserType);
    const page = await browser.newPage();
    await page.evaluate(() => {
      setTimeout(() => {
        // oxlint-disable-next-line no-constant-condition
        while (true) {}
      });
    });

    expect(await close()).toContain("browser");
    expect(await processesOf(servers[0]!)).toEqual([]);
  });
});
