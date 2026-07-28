import { createLogger } from "@ovr/logger";

const logger = createLogger("capture");

export const BOOT_TIMEOUT_MS = 10_000;
export const RENDER_TIMEOUT_MS = 30_000;
export const CAPTURE_JOB_TIMEOUT_MS = 2 * 60 * 1000;

export const CLEANUP_GRACE_MS = 30_000;

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export const withTimeout = async <T>(
  work: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  const controller = new AbortController();
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;

  const workPromise = work(controller.signal);
  workPromise.catch((error: unknown) => {
    if (timedOut) {
      logger.error({ err: error }, "work failed after its timeout had already fired");
    }
  });

  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([workPromise, timeout]);
  } catch (error) {
    if (error instanceof TimeoutError) {
      await waitForSettledOrGrace(workPromise);
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const waitForSettledOrGrace = async (workPromise: Promise<unknown>): Promise<void> => {
  let graceHandle: ReturnType<typeof setTimeout> | undefined;

  const grace = new Promise<void>((resolve) => {
    graceHandle = setTimeout(resolve, CLEANUP_GRACE_MS);
  });

  const settled = workPromise.then(
    () => undefined,
    () => undefined,
  );

  try {
    await Promise.race([settled, grace]);
  } finally {
    clearTimeout(graceHandle);
  }
};
