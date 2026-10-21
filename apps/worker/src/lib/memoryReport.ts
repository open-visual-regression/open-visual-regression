import type { createLogger } from "@ovr/logger";

import { readProcessTree } from "./processTree";

type Logger = ReturnType<typeof createLogger>;

export type MemoryReport = {
  rssBytes: number;
  heapUsedBytes: number;
  heapTotalBytes: number;
  externalBytes: number;
  arrayBuffersBytes: number;
  browserProcesses: number | null;
  browserZombies: number | null;
  browserRssBytes: number | null;
};

// RSS covers the worker threads too (image comparison), which heapUsed and external do not.
export const readMemoryReport = async (): Promise<MemoryReport> => {
  const { rss, heapUsed, heapTotal, external, arrayBuffers } = process.memoryUsage();
  const children = await readProcessTree(process.pid);

  return {
    rssBytes: rss,
    heapUsedBytes: heapUsed,
    heapTotalBytes: heapTotal,
    externalBytes: external,
    arrayBuffersBytes: arrayBuffers,
    browserProcesses: children?.processes ?? null,
    browserZombies: children?.zombies ?? null,
    browserRssBytes: children?.rssBytes ?? null,
  };
};

export const startMemoryReports = (logger: Logger, intervalMs: number): (() => void) => {
  const timer = setInterval(() => {
    readMemoryReport().then(
      (report) => logger.info(report, "worker memory"),
      (err: unknown) => logger.warn({ err }, "failed to read worker memory"),
    );
  }, intervalMs);
  timer.unref();

  return () => clearInterval(timer);
};
