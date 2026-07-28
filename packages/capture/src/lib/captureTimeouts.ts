export const BOOT_TIMEOUT_MS = 10_000;
export const RENDER_TIMEOUT_MS = 30_000;
export const CAPTURE_JOB_TIMEOUT_MS = 2 * 60 * 1000;

// Max time to wait for aborted work to unwind before a retry can start.
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

  const workPromise = work(controller.signal);
  // Avoid an unhandled rejection if work rejects after the race settles.
  workPromise.catch(() => {});

  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
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
