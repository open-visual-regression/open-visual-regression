export const BOOT_TIMEOUT_MS = 10_000;
export const RENDER_TIMEOUT_MS = 30_000;
export const CAPTURE_JOB_TIMEOUT_MS = 2 * 60 * 1000;

export const withTimeout = async <T>(
  work: () => Promise<T>,
  timeoutMs: number,
  onTimeout?: () => void,
): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      onTimeout?.();
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([work(), timeout]);
  } finally {
    clearTimeout(timeoutHandle);
  }
};
