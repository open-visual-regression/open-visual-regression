import { type ORPCErrorCode, type ORPCErrorJSON } from "@orpc/client";

export const createORPCError = (
  code: ORPCErrorCode,
  status = 500,
): ORPCErrorJSON<string, unknown> & { defined: false } => ({
  defined: false,
  code,
  status,
  message: code,
  data: undefined,
});
