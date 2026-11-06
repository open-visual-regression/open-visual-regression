import type { GitProvider } from "@ovr/db/schema";

import { githubApiBase } from "../adapters/githubFamily";
import { readGitHubAppConfig } from "./config";
import {
  createInstallationTokenProvider,
  type InstallationTokenProvider,
} from "./installationTokens";

const providers = new Map<GitProvider, InstallationTokenProvider | null>();

/**
 * The process-wide token provider for the deployment's GitHub App, or null when no App is
 * configured. Created on first use so its token cache lives as long as the process.
 */
export const getGitHubAppTokenProvider = (
  provider: GitProvider,
): InstallationTokenProvider | null => {
  if (!providers.has(provider)) {
    const config = readGitHubAppConfig();
    providers.set(
      provider,
      config && createInstallationTokenProvider({ config, apiBase: githubApiBase(provider) }),
    );
  }

  return providers.get(provider) ?? null;
};
