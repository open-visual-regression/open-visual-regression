import { once } from "node:events";

import { createLogger } from "@ovr/logger";

import { describe, expect, test } from "../../__tests__/fixtures";
import { startBrowserSweep } from "../browserSweep";

const logger = createLogger("worker");

describe("startBrowserSweep", () => {
  test("kills the processes left under the worker when no browser work runs", async ({
    childProcess,
    metrics,
  }) => {
    const browserSweep = startBrowserSweep(logger, 60_000);
    const exited = once(childProcess, "exit");

    try {
      expect(await browserSweep.sweep()).toBeGreaterThanOrEqual(1);
    } finally {
      browserSweep.stop();
    }

    expect((await exited)[1]).toBe("SIGKILL");
    expect(await metrics.scrape()).toMatch(/ovr_worker_browser_processes_killed_total [1-9]/);
  });

  test("leaves processes alone while browser work runs", async ({ childProcess }) => {
    const browserSweep = startBrowserSweep(logger, 60_000);

    try {
      const sweepDuringWork = browserSweep.track(() => browserSweep.sweep());
      expect(await sweepDuringWork()).toBe(0);
    } finally {
      browserSweep.stop();
    }

    expect(childProcess.exitCode).toBeNull();
    expect(childProcess.signalCode).toBeNull();
  });
});
