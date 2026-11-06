import type { GitAuthType, GitProvider } from "@ovr/db/schema";

import { tryDecryptToken } from "./crypto";

export type TokenSource = {
  provider: GitProvider;
  repoIdentifier: string;
  authType: GitAuthType;
  encryptedToken: string | null;
};

export type ResolvedToken =
  | {
      ok: true;
      token: string;
      // Drops any cached copy of this token so the next resolve fetches a fresh one. Static
      // tokens have nothing to drop, so they leave it unset.
      invalidate?: () => void;
    }
  | {
      ok: false;
      error: string;
      // Network and provider outages are worth retrying; misconfiguration is not.
      retryable: boolean;
    };

export type ResolveTokenDeps = {
  tryDecryptToken: (payload: string) => string | null;
};

const defaultDeps: ResolveTokenDeps = { tryDecryptToken };

export const resolveToken = async (
  source: TokenSource,
  deps: ResolveTokenDeps = defaultDeps,
): Promise<ResolvedToken> => {
  switch (source.authType) {
    case "token": {
      if (source.encryptedToken === null) {
        return { ok: false, error: "no access token is stored, enter one", retryable: false };
      }

      const token = deps.tryDecryptToken(source.encryptedToken);
      if (token === null) {
        return {
          ok: false,
          error: "stored token could not be decrypted, re-enter it",
          retryable: false,
        };
      }

      return { ok: true, token };
    }
    case "github_app":
      return {
        ok: false,
        error: "GitHub App authentication is not supported by this version",
        retryable: false,
      };
  }
};
