import type { GitAuthType, GitProvider } from "@ovr/db/schema";

import type { VerifyOutcome } from "../publisher";

/** The parts of a git integration that decide how it authenticates. */
export type IntegrationAuth = {
  provider: GitProvider;
  repoIdentifier: string;
  authType: GitAuthType;
  encryptedToken: string | null;
};

export type ResolvedToken =
  | {
      ok: true;
      token: string;
      // Drops any cached copy of this token so the next resolve fetches a fresh one. Methods
      // that don't cache tokens leave it unset.
      invalidate?: () => void;
    }
  | {
      ok: false;
      error: string;
      // Network and provider outages are worth retrying; misconfiguration is not.
      retryable: boolean;
    };

/** One way of authenticating with a provider, such as a stored token or an app installation. */
export type AuthMethod = {
  resolveToken: (integration: IntegrationAuth) => Promise<ResolvedToken>;
  /** Checks the integration can publish commit statuses, for the settings page's health check. */
  verify: (integration: IntegrationAuth) => Promise<VerifyOutcome>;
};
