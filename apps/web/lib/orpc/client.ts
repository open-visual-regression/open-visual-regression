import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { type ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import { type contract } from "@ovr/api/contracts/contract";

/**
 * Browser oRPC client. Requests are sent over HTTP to the RPC handler mounted
 * at `/api/rpc`, which is used for client-driven data fetching such as loading
 * additional pages of an infinite query.
 */
const link = new RPCLink({
  url: () => `${window.location.origin}/api/rpc`,
});

const client: ContractRouterClient<typeof contract> = createORPCClient(link);

/**
 * TanStack Query utilities (query keys, query/infinite options, ...) derived
 * from the oRPC contract. Query keys generated here match the ones produced by
 * the server-side utils, so data prefetched during SSR hydrates seamlessly.
 */
export const orpc = createTanstackQueryUtils(client);
