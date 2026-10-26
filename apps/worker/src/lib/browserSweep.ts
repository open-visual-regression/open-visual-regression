import { readProcessTree } from "@ovr/capture-browser/processTree";
import type { createLogger } from "@ovr/logger";
import { createCounter } from "@ovr/metrics";

type Logger = ReturnType<typeof createLogger>;

const browserProcessesKilled = createCounter("ovr.worker.browser.processes.killed", {
  description:
    "Browser processes still running with no browser work in flight, which the worker killed.",
});

export type BrowserSweep = {
  /** Wraps a job processor that launches browsers, so the sweep leaves them alone while it runs. */
  track: <A extends unknown[], R>(
    processor: (...args: A) => Promise<R>,
  ) => (...args: A) => Promise<R>;
  /** Kills every process under the worker if no tracked processor is running. Returns how many. */
  sweep: () => Promise<number>;
  stop: () => void;
};

// Only browsers run as child processes of the worker, and every job closes the browsers it
// launched before it finishes, so anything left while no such job runs is a leaked browser.
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
    // A job that started while the tree was read may have launched some of these processes.
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
      "killed browser processes left running with no browser work in flight",
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
