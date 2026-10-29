"use server";

import { getProvider, listProviders } from "@ovr/git-status/registry";

import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const list = os.gitProviders.list
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(() => ({
    providers: listProviders().map((provider) => {
      const connectionsConfigured = provider.connections?.isConfigured() ?? false;

      return {
        id: provider.id,
        name: provider.name,
        repository: { placeholder: provider.repository.placeholder },
        credentialTypes: connectionsConfigured
          ? (["connection", "access_token"] as const)
          : (["access_token"] as const),
        connections: provider.connections
          ? {
              label: provider.connections.label,
              setupGuideUrl: provider.connections.setupGuideUrl,
              configured: connectionsConfigured,
            }
          : null,
      };
    }),
  }))
  .actionable();

export const connections = os.gitProviders.connections
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async () => ({
    providers: await Promise.all(
      listProviders().flatMap(({ id, name, connections: source }) =>
        source
          ? [
              source.status().then((status) => ({
                provider: id,
                providerName: name,
                label: source.label,
                setupGuideUrl: source.setupGuideUrl,
                status,
              })),
            ]
          : [],
      ),
    ),
  }))
  .actionable();

export const searchRepositories = os.gitProviders.searchRepositories
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input }) => {
    const provider = getProvider(input.provider);

    if (!provider.connections) {
      return { status: "error" as const, error: `${provider.name} does not support connections` };
    }

    const page = await provider.connections.searchRepositories(input);

    return "error" in page
      ? { status: "error" as const, error: page.error }
      : { status: "ok" as const, ...page };
  })
  .actionable();
