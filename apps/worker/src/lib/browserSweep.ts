import { readProcessTree } from "@ovr/capture-browser/processTree";
import type { createLogger } from "@ovr/logger";
import { createCounter } from "@ovr/metrics";

type Logger = ReturnType<typeof createLogger>;

const browserProcessesKilled = createCounter("ovr.worker.browser.processes.killed", {
  description: "Leftover browser processes the worker killed.",
});

export type BrowserSweep = {
  track: <A extends unknown[], R>(
    processor: (...args: A) => Promise<R>,
  ) => (...args: A) => Promise<R>;
  sweep: () => Promise<number>;
  stop: () => void;
};

// Every job closes its browsers before it finishes, so any left while none runs have leaked.
export const startBrowserSweep = (logger: Logger, intervalMs: number): BrowserSweep => {
  let running = 0;
  let started = 0;

  const track: BrowserSweep["track"] =
    (processor) =>
    async (...args) => {
      running += 1;
      started += 1;
      try {
        return await processor(...args);
      } finally {
        running -= 1;
      }
    };

  const sweep = async (): Promise<number> => {
    if (running > 0) {
      return 0;
    }

    const startedBefore = started;
    const tree = await readProcessTree(process.pid);
    if (!tree || tree.pids.length === 0 || running > 0 || started !== startedBefore) {
      return 0;
    }

    for (const pid of tree.pids) {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // Already gone.
      }
    }
    logger.warn(
      { processes: tree.pids.length, rssBytes: tree.rssBytes },
      "killed leftover browser processes",
    );
    browserProcessesKilled.add(tree.pids.length, {});
    return tree.pids.length;
  };

  const timer = setInterval(() => {
    sweep().catch((err: unknown) => logger.warn({ err }, "failed to sweep leftover browsers"));
  }, intervalMs);
  timer.unref();

  return { track, sweep, stop: () => clearInterval(timer) };
};
