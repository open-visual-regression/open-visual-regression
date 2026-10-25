import { describe, expect, test } from "../../__tests__/fixtures";
import { observeBrowserProcesses } from "../memoryReport";

describe("observeBrowserProcesses", () => {
  test("should report the processes the worker launched and their memory", async ({
    childProcess,
    metrics,
  }) => {
    expect(childProcess.pid).toBeDefined();
    observeBrowserProcesses();

    const body = await metrics.scrape();

    expect(body).toMatch(/ovr_worker_browser_processes\{state="running"\} [1-9]/);
    expect(body).toContain('ovr_worker_browser_processes{state="zombie"} 0');
    expect(body).toMatch(/ovr_worker_browser_memory_bytes [1-9]/);
  });
});
