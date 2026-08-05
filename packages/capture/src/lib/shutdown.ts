const shutdown = new AbortController();

export const beginShutdown = (): void => shutdown.abort();

export const isShuttingDown = (): boolean => shutdown.signal.aborted;
