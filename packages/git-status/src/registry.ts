import type { GitProvider } from "@ovr/db/schema";

import { githubProvider } from "./providers/github";
import type { GitProviderModule } from "./providers/types";

export type { GitProviderModule } from "./providers/types";

const PROVIDERS: Record<GitProvider, GitProviderModule> = {
  github: githubProvider,
};

export const getProvider = (id: GitProvider): GitProviderModule => PROVIDERS[id];

export const listProviders = (): GitProviderModule[] => Object.values(PROVIDERS);
