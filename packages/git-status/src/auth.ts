import type { GitAuthType, GitProvider } from "@ovr/db/schema";

import { githubAppAuth } from "./authMethods/githubApp";
import { staticTokenAuth } from "./authMethods/staticToken";
import type { AuthMethod, IntegrationAuth, ResolvedToken } from "./authMethods/types";
import type { VerifyOutcome } from "./publisher";

export type { IntegrationAuth, ResolvedToken };

// Adapters only ever see the token, so new providers and auth methods are registered here.
const authMethods: Record<GitProvider, Partial<Record<GitAuthType, AuthMethod>>> = {
  github: { token: staticTokenAuth, github_app: githubAppAuth },
};

const methodFor = ({ provider, authType }: IntegrationAuth): AuthMethod | undefined =>
  authMethods[provider][authType];

const unsupported = ({ provider, authType }: IntegrationAuth): string =>
  `${authType} authentication is not supported for ${provider}`;

export const resolveToken = async (integration: IntegrationAuth): Promise<ResolvedToken> => {
  const method = methodFor(integration);
  if (!method) {
    return { ok: false, error: unsupported(integration), retryable: false };
  }

  return method.resolveToken(integration);
};

export const verifyIntegration = async (integration: IntegrationAuth): Promise<VerifyOutcome> => {
  const method = methodFor(integration);
  if (!method) {
    return { ok: false, httpStatus: null, error: unsupported(integration) };
  }

  return method.verify(integration);
};

export const availableAuthTypes = (): Record<GitProvider, GitAuthType[]> => {
  const entries = Object.entries(authMethods).map(([provider, methods]) => [
    provider,
    Object.entries(methods)
      .filter(([, method]) => method.isAvailable())
      .map(([authType]) => authType as GitAuthType),
  ]);
  return Object.fromEntries(entries) as Record<GitProvider, GitAuthType[]>;
};
