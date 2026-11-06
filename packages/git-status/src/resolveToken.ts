import type { GitAuthType, GitProvider } from "@ovr/db/schema";

import { tryDecryptToken } from "./crypto";
import { GITHUB_APP_NOT_CONFIGURED, GitHubAppConfigError } from "./githubApp/config";
import { GitHubAppError, type InstallationTokenProvider } from "./githubApp/installationTokens";
import { getGitHubAppTokenProvider } from "./githubApp/provider";

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
  githubAppTokens: (provider: GitProvider) => InstallationTokenProvider | null;
};

const defaultDeps: ResolveTokenDeps = {
  tryDecryptToken,
  githubAppTokens: getGitHubAppTokenProvider,
};

const resolveAppToken = async (
  source: TokenSource,
  deps: ResolveTokenDeps,
): Promise<ResolvedToken> => {
  let tokens: InstallationTokenProvider | null;
  try {
    tokens = deps.githubAppTokens(source.provider);
  } catch (error) {
    if (error instanceof GitHubAppConfigError) {
      return { ok: false, error: error.message, retryable: false };
    }
    throw error;
  }

  if (!tokens) {
    return { ok: false, error: GITHUB_APP_NOT_CONFIGURED, retryable: false };
  }

  try {
    const { token, invalidate } = await tokens.getToken(source.repoIdentifier);
    return { ok: true, token, invalidate };
  } catch (error) {
    if (error instanceof GitHubAppError) {
      return { ok: false, error: error.message, retryable: error.retryable };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      retryable: true,
    };
  }
};

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
      return resolveAppToken(source, deps);
  }
};
