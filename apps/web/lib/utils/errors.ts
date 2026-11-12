"server only";

import { unstable_rethrow } from "next/navigation";

import { createLogger } from "@ovr/logger";

const logger = createLogger("page");

export const isNextControlFlowError = (error: unknown) => {
  try {
    unstable_rethrow(error);
    return false;
  } catch {
    return true;
  }
};

export function serverError(cause: unknown, message?: string): never {
  // While prerendering, `connection()` and `headers()` reject once the shell is
  // done. Next expects those errors back, not logged as page failures.
  unstable_rethrow(cause);

  logger.error({ err: cause }, "unhandled page error");
  throw new Error(message ?? "An unexpected server error occurred");
}
