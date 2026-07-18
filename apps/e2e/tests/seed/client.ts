import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { BrowserContext } from "@playwright/test";

import { contract } from "@ovr/api/contracts/contract";

import { getBaseURL } from "../constants";

export type SeedClient = ContractRouterClient<typeof contract>;

export const createSeedClient = (baseURL: string, cookie: string): SeedClient => {
  const link = new RPCLink({
    url: `${baseURL}/api/rpc`,
    headers: () => ({ cookie }),
  });

  return createORPCClient(link);
};

// Builds a seed client that reuses the browser context's signed-in session.
export const seedClientForContext = async (context: BrowserContext): Promise<SeedClient> => {
  const cookie = (await context.cookies()).map(({ name, value }) => `${name}=${value}`).join("; ");
  return createSeedClient(getBaseURL(), cookie);
};
