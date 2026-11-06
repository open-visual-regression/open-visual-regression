import { z } from "zod";

import type { GitHubAppConfig } from "./config";
import { signAppJwt } from "./jwt";

const GITHUB_API_VERSION = "2022-11-28";
// Installation tokens live for an hour; swap them out well before that so a token never expires
// between being handed out and being used.
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

export class GitHubAppError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly httpStatus: number | null,
  ) {
    super(message);
    this.name = "GitHubAppError";
  }
}

export type GitHubAppClientOptions = {
  config: GitHubAppConfig;
  apiBase: string;
  fetch?: typeof fetch;
  now?: () => number;
};

const installationSchema = z.object({
  id: z.number().int(),
  permissions: z.record(z.string(), z.string()).default({}),
});

export type RepoInstallation = z.infer<typeof installationSchema>;

const accessTokenSchema = z.object({
  token: z.string().min(1),
  expires_at: z.string(),
});

const isRateLimited = (response: Response): boolean =>
  response.status === 429 ||
  (response.status === 403 &&
    (response.headers.get("x-ratelimit-remaining") === "0" || response.headers.has("retry-after")));

const requestAsApp = async (
  options: GitHubAppClientOptions,
  method: "GET" | "POST",
  path: string,
  action: string,
): Promise<Response> => {
  const fetchImpl = options.fetch ?? fetch;
  const now = options.now ?? Date.now;

  let response: Response;
  try {
    response = await fetchImpl(`${options.apiBase}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${signAppJwt(options.config, now())}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": GITHUB_API_VERSION,
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new GitHubAppError(`could not reach GitHub to ${action}: ${reason}`, true, null);
  }

  if (response.ok) {
    return response;
  }

  if (response.status >= 500 || isRateLimited(response)) {
    throw new GitHubAppError(
      `GitHub responded with ${response.status} while trying to ${action}`,
      true,
      response.status,
    );
  }

  if (response.status === 401) {
    throw new GitHubAppError(
      "GitHub rejected the App's credentials; check OVR_GITHUB_APP_ID and OVR_GITHUB_APP_PRIVATE_KEY",
      false,
      401,
    );
  }

  return response;
};

/** Finds the App's installation that covers `repo` (`owner/name`). */
export const findRepoInstallation = async (
  options: GitHubAppClientOptions,
  repo: string,
): Promise<RepoInstallation> => {
  const response = await requestAsApp(
    options,
    "GET",
    `/repos/${repo}/installation`,
    `find the App's installation for ${repo}`,
  );

  if (response.status === 404) {
    throw new GitHubAppError(`the GitHub App is not installed on ${repo}`, false, 404);
  }

  if (!response.ok) {
    throw new GitHubAppError(
      `GitHub responded with ${response.status} while looking up the App's installation for ${repo}`,
      false,
      response.status,
    );
  }

  const parsed = installationSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    throw new GitHubAppError("GitHub returned an unexpected installation response", true, null);
  }

  return parsed.data;
};

type InstallationToken = { token: string; expiresAt: number };

const createInstallationToken = async (
  options: GitHubAppClientOptions,
  installationId: number,
): Promise<InstallationToken> => {
  const response = await requestAsApp(
    options,
    "POST",
    `/app/installations/${installationId}/access_tokens`,
    "create an installation token",
  );

  if (!response.ok) {
    throw new GitHubAppError(
      response.status === 404
        ? "the GitHub App's installation no longer exists"
        : `GitHub responded with ${response.status} while creating an installation token`,
      false,
      response.status,
    );
  }

  const parsed = accessTokenSchema.safeParse(await response.json().catch(() => null));
  const expiresAt = parsed.success ? Date.parse(parsed.data.expires_at) : Number.NaN;
  if (!parsed.success || Number.isNaN(expiresAt)) {
    throw new GitHubAppError(
      "GitHub returned an unexpected installation token response",
      true,
      null,
    );
  }

  return { token: parsed.data.token, expiresAt };
};

export type AppToken = {
  token: string;
  /** Forgets this token, e.g. after GitHub rejected it, so the next call mints a new one. */
  invalidate: () => void;
};

export type InstallationTokenProvider = {
  getToken: (repo: string) => Promise<AppToken>;
};

type CacheEntry = { promise: Promise<InstallationToken>; settled?: InstallationToken };

/**
 * Hands out installation tokens for repos the App is installed on. Tokens are cached in memory
 * per installation, refreshed shortly before they expire, and concurrent callers share a single
 * in-flight request.
 */
export const createInstallationTokenProvider = (
  options: GitHubAppClientOptions,
): InstallationTokenProvider => {
  const now = options.now ?? Date.now;
  const installationIds = new Map<string, Promise<number>>();
  const tokens = new Map<number, CacheEntry>();

  const installationIdFor = (repo: string): Promise<number> => {
    const key = repo.toLowerCase();
    const cached = installationIds.get(key);
    if (cached) {
      return cached;
    }

    const lookup = findRepoInstallation(options, repo).then(({ id }) => id);
    installationIds.set(key, lookup);
    lookup.catch(() => {
      if (installationIds.get(key) === lookup) {
        installationIds.delete(key);
      }
    });
    return lookup;
  };

  const isFresh = (entry: CacheEntry): boolean =>
    !entry.settled || entry.settled.expiresAt - REFRESH_BEFORE_EXPIRY_MS > now();

  const tokenFor = (installationId: number): Promise<InstallationToken> => {
    const cached = tokens.get(installationId);
    if (cached && isFresh(cached)) {
      return cached.promise;
    }

    const entry: CacheEntry = { promise: createInstallationToken(options, installationId) };
    tokens.set(installationId, entry);
    entry.promise.then(
      (token) => {
        entry.settled = token;
      },
      () => {
        if (tokens.get(installationId) === entry) {
          tokens.delete(installationId);
        }
      },
    );
    return entry.promise;
  };

  const getToken = async (repo: string): Promise<AppToken> => {
    const installationId = await installationIdFor(repo);

    let token: InstallationToken;
    try {
      token = await tokenFor(installationId);
    } catch (error) {
      // The App may have been uninstalled and reinstalled under a new id; look it up again next time.
      if (error instanceof GitHubAppError && error.httpStatus === 404) {
        installationIds.delete(repo.toLowerCase());
      }
      throw error;
    }

    return {
      token: token.token,
      invalidate: () => {
        if (tokens.get(installationId)?.settled === token) {
          tokens.delete(installationId);
        }
      },
    };
  };

  return { getToken };
};
