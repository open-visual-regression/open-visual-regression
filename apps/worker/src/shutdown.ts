const controller = new AbortController();

/**
 * Aborted once the worker starts draining. Handlers pass this into long-running
 * work so it can stop at a safe point and let BullMQ retry on another pod.
 */
export const shutdownSignal = controller.signal;

export const beginShutdown = (): void => controller.abort();
