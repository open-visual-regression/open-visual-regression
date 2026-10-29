import type { GitProviderSchema } from "@ovr/api/contracts/gitIntegrations";

type GitRepositoriesQueryOptions = {
  input: { provider: GitProviderSchema; query: string };
  enabled: boolean;
  staleTime: number;
};

/** Searches a provider's connected repositories. Only runs while the picker is open. */
export const gitRepositoriesQueryOptions = (
  provider: GitProviderSchema,
  query: string,
  enabled: boolean,
): GitRepositoriesQueryOptions => ({
  input: { provider, query },
  enabled,
  staleTime: 30_000,
});
