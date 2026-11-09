import { githubApiBase } from "../adapters/githubFamily";
import {
  GITHUB_APP_NOT_CONFIGURED,
  GitHubAppConfigError,
  readGitHubAppConfig,
  type GitHubAppConfig,
} from "../githubApp/config";
import {
  createInstallationTokenProvider,
  findRepoInstallation,
  GitHubAppError,
  type GitHubAppClientOptions,
} from "../githubApp/installationTokens";
import type { AuthMethod } from "./types";

type Failure = { message: string; retryable: boolean; httpStatus: number | null };

const toFailure = (error: unknown): Failure =>
  error instanceof GitHubAppError
    ? { message: error.message, retryable: error.retryable, httpStatus: error.httpStatus }
    : {
        message: error instanceof Error ? error.message : String(error),
        retryable: true,
        httpStatus: null,
      };

const unavailableAuth = (error: string): AuthMethod => ({
  isAvailable: () => false,
  resolveToken: async () => ({ ok: false, error, retryable: false }),
  verify: async () => ({ ok: false, httpStatus: null, error }),
});

type GitHubAppAuthOptions = {
  config: GitHubAppConfig;
  apiBase?: string;
};

export const createGitHubAppAuth = ({
  config,
  apiBase = githubApiBase("github"),
}: GitHubAppAuthOptions): AuthMethod => {
  const client: GitHubAppClientOptions = { config, apiBase };
  const tokens = createInstallationTokenProvider(client);

  return {
    isAvailable: () => true,
    resolveToken: async ({ repoIdentifier }) => {
      try {
        const { token, invalidate } = await tokens.getToken(repoIdentifier);
        return { ok: true, token, invalidate };
      } catch (error) {
        const { message, retryable } = toFailure(error);
        return { ok: false, error: message, retryable };
      }
    },

    verify: async ({ repoIdentifier }) => {
      try {
        const installation = await findRepoInstallation(client, repoIdentifier);
        if (installation.permissions.statuses !== "write") {
          return {
            ok: false,
            httpStatus: 200,
            error: `the GitHub App cannot write commit statuses to ${repoIdentifier}; give it the "Commit statuses: Read and write" permission and approve the change on the installation`,
          };
        }
        return { ok: true, httpStatus: 200, error: null };
      } catch (error) {
        const { message, httpStatus } = toFailure(error);
        return { ok: false, httpStatus, error: message };
      }
    },
  };
};

const fromConfig = (): AuthMethod => {
  try {
    const config = readGitHubAppConfig();
    return config ? createGitHubAppAuth({ config }) : unavailableAuth(GITHUB_APP_NOT_CONFIGURED);
  } catch (error) {
    if (error instanceof GitHubAppConfigError) {
      return unavailableAuth(error.message);
    }
    throw error;
  }
};

// Keyed by the env, so the token cache lives as long as the config does.
let current: { env: string; auth: AuthMethod } | undefined;

const fromEnvironment = (): AuthMethod => {
  const env = `${process.env.OVR_GITHUB_APP_ID ?? ""}\0${process.env.OVR_GITHUB_APP_PRIVATE_KEY_FILE ?? ""}`;
  if (current?.env !== env) {
    current = { env, auth: fromConfig() };
  }
  return current.auth;
};

export const githubAppAuth: AuthMethod = {
  isAvailable: () => fromEnvironment().isAvailable(),
  resolveToken: (integration) => fromEnvironment().resolveToken(integration),
  verify: (integration) => fromEnvironment().verify(integration),
};
