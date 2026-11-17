import { launchBrowser } from "../browser";
import { BROWSER_TYPES, processesOf, spyOnServers } from "./browserServers";
import { describe, expect, test } from "./fixtures";

// Uses the real close timeouts: a healthy browser can take over a second to
// shut down on a busy CI runner, and that must not count as a forced close.
describe.each(BROWSER_TYPES)("launchBrowser ($name)", ({ browserType, installed }) => {
  test.skipIf(!installed)("closes the browser and all of its processes", async () => {
    const servers = spyOnServers(browserType);
    const { browser, close } = await launchBrowser(browserType);
    await browser.newPage();

    expect(await close()).toEqual([]);
    expect(await processesOf(servers[0])).toEqual([]);
  });
});
