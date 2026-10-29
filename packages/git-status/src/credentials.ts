import type { GitAuthType, GitProvider } from "@ovr/db/schema";

import { tryDecryptToken } from "./crypto";
import { GithubAppRequestError } from "./githubApp/client";
import {
  getGithubAppConfig,
  GithubAppConfigError,
  REJECTED_CREDENTIALS_MESSAGE,
  type GithubAppConfig,
} from "./githubApp/config";
import {
  getInstallationToken,
  invalidateInstallationToken,
  statusesScope,
} from "./githubApp/tokens";

export type IntegrationCredentials = {
  provider: GitProvider;
  repoIdentifier: string;
  authType: GitAuthType;
  encryptedToken: string | null;
  githubInstallationId: number | null;
  externalRepoId: number | null;
};

export type Credential =
  | {
      ok: true;
      token: string;
      /** Fetches a fresh token after the provider rejected this one. Null when there is nothing to renew. */
      renew: (() => Promise<Credential>) | null;
    }
  | { ok: false; error: string; retryable: boolean };

const failure = (error: string, retryable = false): Credential => ({
  ok: false,
  error,
  retryable,
});

const resolveAccessToken = ({ encryptedToken }: IntegrationCredentials): Credential => {
  if (encryptedToken === null) {
    return failure("no access token is stored, enter one");
  }

  const token = tryDecryptToken(encryptedToken);
  if (token === null) {
    return failure("the stored token could not be decrypted, re-enter it");
  }

  return { ok: true, token, renew: null };
};

const describeAppTokenError = (
  error: GithubAppRequestError,
  repoIdentifier: string,
): Credential => {
  switch (error.status) {
    case null:
      return failure(error.message, true);
    case 401:
      return failure(REJECTED_CREDENTIALS_MESSAGE);
    case 404:
      return failure("the github app is no longer installed on this repository's account");
    case 403:
    case 422:
      return failure(
        `the github app can't write commit statuses to ${repoIdentifier}, check the installation's repositories and permissions`,
      );
    default:
      return failure(error.message, error.status === 429 || error.status >= 500);
  }
};

const mintAppToken = async (
  config: GithubAppConfig,
  installationId: number,
  repositoryId: number,
  repoIdentifier: string,
): Promise<Credential> => {
  const scope = statusesScope(repositoryId);

  try {
    const token = await getInstallationToken(config, installationId, scope);
    return {
      ok: true,
      token,
      renew: () => {
        invalidateInstallationToken(config, installationId, scope);
        return mintAppToken(config, installationId, repositoryId, repoIdentifier);
      },
    };
  } catch (error) {
    if (error instanceof GithubAppRequestError) {
      return describeAppTokenError(error, repoIdentifier);
    }
    throw error;
  }
};

const resolveGithubApp = async (integration: IntegrationCredentials): Promise<Credential> => {
  let config: GithubAppConfig | null;
  try {
    config = getGithubAppConfig();
  } catch (error) {
    if (error instanceof GithubAppConfigError) {
      return failure(error.message);
    }
    throw error;
  }

  if (!config) {
    return failure("github app is not configured on this instance");
  }

  if (integration.githubInstallationId === null || integration.externalRepoId === null) {
    return failure("the integration is missing its github app installation, link it again");
  }

  return mintAppToken(
    config,
    integration.githubInstallationId,
    integration.externalRepoId,
    integration.repoIdentifier,
  );
};

/** The token to call the provider with, however the integration authenticates. */
export const resolveCredential = async (
  integration: IntegrationCredentials,
): Promise<Credential> => {
  switch (integration.authType) {
    case "access_token":
      return resolveAccessToken(integration);
    case "github_app":
      return resolveGithubApp(integration);
  }
};
