import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ClientRetryPlugin } from "@orpc/client/plugins";
import type { ContractRouterClient } from "@orpc/contract";
import { contract } from "@ovr/api/contracts/contract";

export type OvrClient = ContractRouterClient<typeof contract>;

export const createClient = (serverUrl: string, apiKey: string): OvrClient => {
  const link = new RPCLink({
    url: `${serverUrl}/api/rpc`,
    headers: () => ({
      authorization: `Bearer ${apiKey}`,
    }),
    plugins: [
      new ClientRetryPlugin({
        default: {
          retry: 3,
          retryDelay: ({ attemptIndex }) => Math.min(1000 * 2 ** attemptIndex, 10_000),
          shouldRetry: ({ error }) => !(error instanceof ORPCError) || error.status >= 500,
        },
      }),
    ],
  });

  return createORPCClient(link);
};
