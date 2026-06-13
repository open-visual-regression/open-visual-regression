import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { contract } from "@ovr/api/contracts/contract";

export type OvrClient = ContractRouterClient<typeof contract>;

export const createClient = (serverUrl: string, apiKey: string): OvrClient => {
  const link = new RPCLink({
    url: `${serverUrl}/api/rpc`,
    headers: () => ({
      authorization: `Bearer ${apiKey}`,
    }),
  });

  return createORPCClient(link);
};
