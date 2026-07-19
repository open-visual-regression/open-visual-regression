import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ClientRetryPlugin, type ClientRetryPluginContext } from "@orpc/client/plugins";
import { type ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import { type contract } from "@ovr/api/contracts/contract";

const link = new RPCLink<ClientRetryPluginContext>({
  url: () => `${window.location.origin}/api/rpc`,
  plugins: [new ClientRetryPlugin()],
});

export const client: ContractRouterClient<typeof contract, ClientRetryPluginContext> =
  createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
