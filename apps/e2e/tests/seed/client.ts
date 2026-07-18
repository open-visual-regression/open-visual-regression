import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";

import { contract } from "@ovr/api/contracts/contract";

export type SeedClient = ContractRouterClient<typeof contract>;

export const createSeedClient = (baseURL: string, cookie: string): SeedClient => {
  const link = new RPCLink({
    url: `${baseURL}/api/rpc`,
    headers: () => ({ cookie }),
  });

  return createORPCClient(link);
};
