import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ClientRetryPlugin } from "@orpc/client/plugins";
import type { ContractRouterClient } from "@orpc/contract";

import { contract, SERVER_VERSION_HEADER } from "@ovr/api/contracts/contract";

import { describeError, UnsupportedByServerError } from "./errors";

export type OvrClient = ContractRouterClient<typeof contract>;

export const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 10_000;

export class RequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`no response after ${timeoutMs / 1000}s`);
    this.name = "RequestTimeoutError";
  }
}

const isUnknownProcedure = (response: Response): boolean =>
  response.status === 404 && !response.headers.get("content-type");

export const createClient = (
  serverUrl: string,
  apiKey: string,
  {
    timeoutMs = REQUEST_TIMEOUT_MS,
    retryDelayMs = RETRY_DELAY_MS,
  }: { timeoutMs?: number; retryDelayMs?: number } = {},
): OvrClient => {
  const link = new RPCLink({
    url: `${serverUrl}/api/rpc`,
    headers: () => ({
      authorization: `Bearer ${apiKey}`,
    }),
    fetch: async (request, init) => {
      const timeout = AbortSignal.timeout(timeoutMs);
      let response: Response;
      try {
        response = await fetch(request, {
          ...init,
          signal: AbortSignal.any([request.signal, timeout]),
        });
      } catch (error) {
        if (timeout.aborted) {
          throw new RequestTimeoutError(timeoutMs);
        }
        throw error;
      }

      if (isUnknownProcedure(response)) {
        throw new UnsupportedByServerError(response.headers.get(SERVER_VERSION_HEADER));
      }

      return response;
    },
    plugins: [
      new ClientRetryPlugin({
        default: {
          retry: MAX_RETRIES,
          retryDelay: ({ attemptIndex }) =>
            Math.min(retryDelayMs * 2 ** attemptIndex, MAX_RETRY_DELAY_MS),
          shouldRetry: ({ error }) =>
            !(error instanceof UnsupportedByServerError) &&
            (!(error instanceof ORPCError) || error.status >= 500),
          onRetry: ({ path, attemptIndex, error }) => {
            console.error(
              `Request to ${path.join(".")} failed (${describeError(error)}), retrying (${attemptIndex + 1}/${MAX_RETRIES})...`,
            );
          },
        },
      }),
    ],
  });

  return createORPCClient(link);
};
