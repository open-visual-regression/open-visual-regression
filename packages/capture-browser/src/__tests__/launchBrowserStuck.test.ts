import { vi } from "vitest";

import { launchBrowser } from "../browser";
import { BROWSER_TYPES, processesOf, spyOnServers } from "./browserServers";
import { describe, expect, test } from "./fixtures";

// A stuck browser waits out every close timeout before it is killed, so they
// are shortened here to keep the test quick. They apply to this whole file,
// which is why the healthy-close test lives in launchBrowser.test.ts.
vi.mock("../timeouts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../timeouts")>()),
  CONTEXT_CLOSE_TIMEOUT_MS: 500,
  BROWSER_CLOSE_TIMEOUT_MS: 1_000,
}));

describe.each(BROWSER_TYPES)("launchBrowser ($name)", ({ browserType, installed }) => {
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
    expect(await processesOf(servers[0])).toEqual([]);
  });
});
