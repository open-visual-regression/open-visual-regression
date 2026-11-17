import { existsSync } from "node:fs";

import { chromium, firefox, webkit, type BrowserServer, type BrowserType } from "playwright";
import { vi } from "vitest";

import { listProcessFamily } from "../processTree";

// CI installs Chromium only.
export const BROWSER_TYPES = [chromium, firefox, webkit].map((browserType) => ({
  name: browserType.name(),
  browserType,
  installed: existsSync(browserType.executablePath()),
}));

/** Records every browser server a browser type launches, optionally changing each one. */
export const spyOnServers = (
  browserType: BrowserType,
  onLaunch?: (server: BrowserServer) => void,
) => {
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

/** The processes a browser server started that are still running. */
export const processesOf = async (server: BrowserServer | undefined): Promise<number[]> => {
  const pid = server?.process().pid;
  return pid === undefined ? [] : ((await listProcessFamily(pid)) ?? []);
};
