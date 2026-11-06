import type { GitProvider } from "@ovr/db/schema";

import { resolveAdapter } from "./adapters";
import { githubApiBase } from "./adapters/githubFamily";
import {
  GITHUB_APP_NOT_CONFIGURED,
  GitHubAppConfigError,
  readGitHubAppConfig,
  type GitHubAppConfig,
} from "./githubApp/config";
import { findRepoInstallation, GitHubAppError } from "./githubApp/installationTokens";
import { verify, type AdapterConfig, type VerifyOutcome } from "./publisher";

export const verifyIntegration = async (config: AdapterConfig): Promise<VerifyOutcome> => {
  const request = resolveAdapter(config.provider).buildVerifyRequest(config);
  return verify(request);
};

type AppIntegration = { provider: GitProvider; repoIdentifier: string };

/**
 * Checks that the deployment's GitHub App is installed on the repo with permission to write
 * commit statuses. `GET /repos/{repo}` isn't used here: its `permissions` object describes a
 * user's access and isn't documented for installation tokens, so the installation's own
 * permissions are the reliable signal.
 */
export const verifyGitHubAppIntegration = async (
  { provider, repoIdentifier }: AppIntegration,
  readConfig: () => GitHubAppConfig | null = readGitHubAppConfig,
): Promise<VerifyOutcome> => {
  let config: GitHubAppConfig | null;
  try {
    config = readConfig();
  } catch (error) {
    if (error instanceof GitHubAppConfigError) {
      return { ok: false, httpStatus: null, error: error.message };
    }
    throw error;
  }

  if (!config) {
    return { ok: false, httpStatus: null, error: GITHUB_APP_NOT_CONFIGURED };
  }

  try {
    const installation = await findRepoInstallation(
      { config, apiBase: githubApiBase(provider) },
      repoIdentifier,
    );

    if (installation.permissions.statuses !== "write") {
      return {
        ok: false,
        httpStatus: 200,
        error: `the GitHub App cannot write commit statuses to ${repoIdentifier}; give it the "Commit statuses: Read and write" permission and approve the change on the installation`,
      };
    }

    return { ok: true, httpStatus: 200, error: null };
  } catch (error) {
    if (error instanceof GitHubAppError) {
      return { ok: false, httpStatus: error.httpStatus, error: error.message };
    }
    throw error;
  }
};
