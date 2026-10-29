import type { GitCredentialType, GitProvider } from "@ovr/db/schema";

import { tryDecryptToken } from "./crypto";
import { getProvider } from "./registry";

export type IntegrationCredentials = {
  provider: GitProvider;
  repoIdentifier: string;
  credentialType: GitCredentialType;
  encryptedToken: string | null;
  connectionId: string | null;
  externalRepoId: string | null;
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

const resolveConnection = (
  integration: IntegrationCredentials,
): Promise<Credential> | Credential => {
  const connections = getProvider(integration.provider).connections;
  if (!connections) {
    return failure(`${integration.provider} does not support connections`);
  }
  if (integration.connectionId === null || integration.externalRepoId === null) {
    return failure("the integration is missing its connection, link it again");
  }
  return connections.credential(
    integration.connectionId,
    integration.externalRepoId,
    integration.repoIdentifier,
  );
};

/** The token to call the provider with, however the integration authenticates. */
export const resolveCredential = async (
  integration: IntegrationCredentials,
): Promise<Credential> => {
  switch (integration.credentialType) {
    case "access_token":
      return resolveAccessToken(integration);
    case "connection":
      return resolveConnection(integration);
  }
};
