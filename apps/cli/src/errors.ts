import { ORPCError } from "@orpc/client";

export const formatCliError = (error: unknown, serverUrl: string): string => {
  if (error instanceof ORPCError) {
    return `Request to ${serverUrl} failed: ${error.status} ${error.code} - ${error.message}`;
  }

  return error instanceof Error ? error.message : String(error);
};
