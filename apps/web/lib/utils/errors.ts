"server only";

import { createLogger } from "@ovr/logger";

const logger = createLogger("page");

export function serverError(cause: unknown, message?: string): never {
  logger.error({ err: cause }, "unhandled page error");
  throw new Error(message ?? "An unexpected server error occurred");
}
