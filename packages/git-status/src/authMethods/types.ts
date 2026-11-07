import type { GitAuthType, GitProvider } from "@ovr/db/schema";

import type { VerifyOutcome } from "../publisher";

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
      // Set by methods that cache tokens, to drop one the provider rejected.
      invalidate?: () => void;
    }
  | {
      ok: false;
      error: string;
      retryable: boolean;
    };

export type AuthMethod = {
  isAvailable: () => boolean;
  resolveToken: (integration: IntegrationAuth) => Promise<ResolvedToken>;
  verify: (integration: IntegrationAuth) => Promise<VerifyOutcome>;
};
