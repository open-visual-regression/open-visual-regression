import {
  createInstallationToken,
  GithubAppRequestError,
  listInstallationRepositories,
  type GithubAppRepository,
  type InstallationToken,
  type InstallationTokenScope,
} from "./client";
import type { GithubAppConfig } from "./config";

// Installation tokens live for an hour. Renew a little early so a token never expires
// between being handed out and being used.
const RENEW_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

const tokens = new Map<string, InstallationToken>();

const cacheKey = (config: GithubAppConfig, installationId: number, scope: InstallationTokenScope) =>
  JSON.stringify([
    config.clientId,
    installationId,
    [...(scope.repositoryIds ?? [])].sort((a, b) => a - b),
    Object.entries(scope.permissions).sort(([a], [b]) => a.localeCompare(b)),
  ]);

/** An installation token for the scope, reused from the cache until it is close to expiring. */
export const getInstallationToken = async (
  config: GithubAppConfig,
  installationId: number,
  scope: InstallationTokenScope,
  now: () => number = Date.now,
): Promise<string> => {
  const key = cacheKey(config, installationId, scope);
  const cached = tokens.get(key);

  if (cached && cached.expiresAt - RENEW_BEFORE_EXPIRY_MS > now()) {
    return cached.token;
  }

  const minted = await createInstallationToken(config, installationId, scope);
  tokens.set(key, minted);
  return minted.token;
};

/** Drops a cached token, e.g. after GitHub rejected it, so the next call mints a fresh one. */
export const invalidateInstallationToken = (
  config: GithubAppConfig,
  installationId: number,
  scope: InstallationTokenScope,
): void => {
  tokens.delete(cacheKey(config, installationId, scope));
};

export const clearInstallationTokens = (): void => {
  tokens.clear();
};

/**
 * The token scope used to post commit statuses to one repository. Metadata read is granted to
 * every installation, and lets the same token look the repository up when testing the connection.
 */
export const statusesScope = (repositoryId: number): InstallationTokenScope => ({
  repositoryIds: [repositoryId],
  permissions: { statuses: "write", metadata: "read" },
});

const METADATA_SCOPE: InstallationTokenScope = { permissions: { metadata: "read" } };

/** The repositories an installation has been granted, for picking one to link. */
export const listRepositoriesForInstallation = async (
  config: GithubAppConfig,
  installationId: number,
): Promise<GithubAppRepository[]> => {
  const token = await getInstallationToken(config, installationId, METADATA_SCOPE);

  try {
    return await listInstallationRepositories(token);
  } catch (error) {
    // A cached token can be revoked before it expires, e.g. when the app is reinstalled.
    if (!(error instanceof GithubAppRequestError) || error.status !== 401) {
      throw error;
    }
    invalidateInstallationToken(config, installationId, METADATA_SCOPE);
    return listInstallationRepositories(
      await getInstallationToken(config, installationId, METADATA_SCOPE),
    );
  }
};
