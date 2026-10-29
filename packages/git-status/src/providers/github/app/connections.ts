import { z } from "zod";

import type { Credential } from "../../../credentials";
import type { VerifyOutcome } from "../../../publisher";
import type {
  GitConnections,
  GitConnectionsStatus,
  GitRepository,
  GitRepositoryPage,
} from "../../types";
import { githubApiUrl, githubHeaders } from "../api";
import { getApp, GithubAppRequestError, listInstallations } from "./client";
import { getGithubAppConfig, GithubAppConfigError, type GithubAppConfig } from "./config";
import {
  getInstallationToken,
  invalidateInstallationToken,
  listRepositoriesForInstallation,
  statusesScope,
} from "./tokens";

const SETUP_GUIDE_URL = "https://docs.openvisualregression.com/self-hosting/github-app";
const REJECTED_CREDENTIALS =
  "github rejected the app's credentials, check OVR_GITHUB_APP_CLIENT_ID and OVR_GITHUB_APP_PRIVATE_KEY";
const NOT_CONFIGURED = "github app is not configured on this instance";
const PAGE_SIZE = 50;

type Loaded = { config: GithubAppConfig } | { error: string } | { notConfigured: true };

const loadConfig = (): Loaded => {
  try {
    const config = getGithubAppConfig();
    return config ? { config } : { notConfigured: true };
  } catch (error) {
    if (error instanceof GithubAppConfigError) {
      return { error: error.message };
    }
    throw error;
  }
};

const describe = (error: unknown): string => {
  if (!(error instanceof GithubAppRequestError)) {
    throw error;
  }
  return error.status === 401 ? REJECTED_CREDENTIALS : error.message;
};

const parseId = (id: string): number | null => (/^\d+$/.test(id) ? Number(id) : null);

const failure = (error: string, retryable = false): Credential => ({
  ok: false,
  error,
  retryable,
});

const toRepositories = (
  installationId: number,
  repositories: { id: number; fullName: string; private: boolean }[],
) =>
  repositories.map(
    (repository): GitRepository => ({
      connectionId: String(installationId),
      id: String(repository.id),
      fullName: repository.fullName,
      private: repository.private,
    }),
  );

const status = async (): Promise<GitConnectionsStatus> => {
  const loaded = loadConfig();
  if ("notConfigured" in loaded) {
    return { status: "not_configured" };
  }
  if ("error" in loaded) {
    return { status: "error", error: loaded.error };
  }
  const { config } = loaded;

  try {
    const [app, installations] = await Promise.all([getApp(config), listInstallations(config)]);

    return {
      status: "ok",
      name: app.name,
      description: [
        app.ownerLogin ? `owned by ${app.ownerLogin}` : null,
        `commit statuses: ${app.permissions.statuses ?? "no access"}`,
      ]
        .filter(Boolean)
        .join(" · "),
      manageUrl: app.htmlUrl,
      addUrl: `${app.htmlUrl}/installations/new`,
      warnings:
        app.permissions.statuses === "write"
          ? []
          : [
              "the app can't write commit statuses. grant \"commit statuses: read & write\" in the app's settings.",
            ],
      connections: await Promise.all(
        installations.map(async (installation) => ({
          id: String(installation.id),
          name: installation.accountLogin ?? "unknown account",
          description: installation.accountType?.toLowerCase() ?? null,
          manageUrl: installation.htmlUrl,
          repositoryCount: installation.suspended
            ? null
            : await listRepositoriesForInstallation(config, installation.id).then(
                (repositories) => repositories.length,
                () => null,
              ),
          warnings: installation.suspended ? ["suspended"] : [],
        })),
      ),
    };
  } catch (error) {
    return { status: "error", error: describe(error) };
  }
};

const searchRepositories: GitConnections["searchRepositories"] = async ({
  connectionId,
  query,
  cursor,
}): Promise<GitRepositoryPage | { error: string }> => {
  const loaded = loadConfig();
  if ("notConfigured" in loaded) {
    return { error: NOT_CONFIGURED };
  }
  if ("error" in loaded) {
    return loaded;
  }
  const { config } = loaded;

  try {
    const installationIds =
      connectionId === undefined
        ? (await listInstallations(config))
            .filter((installation) => !installation.suspended)
            .map((installation) => installation.id)
        : [parseId(connectionId)].filter((id): id is number => id !== null);

    const needle = query?.trim().toLowerCase() ?? "";
    const matches = (
      await Promise.all(
        installationIds.map(async (id) =>
          toRepositories(id, await listRepositoriesForInstallation(config, id)),
        ),
      )
    )
      .flat()
      .filter((repository) => repository.fullName.toLowerCase().includes(needle))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const offset = Number(cursor ?? 0) || 0;
    const next = offset + PAGE_SIZE;
    return {
      repositories: matches.slice(offset, next),
      nextCursor: next < matches.length ? String(next) : null,
    };
  } catch (error) {
    return { error: describe(error) };
  }
};

const getRepository: GitConnections["getRepository"] = async (connectionId, repositoryId) => {
  const loaded = loadConfig();
  if ("notConfigured" in loaded) {
    return { error: NOT_CONFIGURED };
  }
  if ("error" in loaded) {
    return loaded;
  }

  const installationId = parseId(connectionId);
  if (installationId === null) {
    return { error: "that github app installation doesn't exist" };
  }

  try {
    const repository = toRepositories(
      installationId,
      await listRepositoriesForInstallation(loaded.config, installationId),
    ).find(({ id }) => id === repositoryId);
    return repository ?? { error: "the github app installation can't access that repository" };
  } catch (error) {
    return { error: describe(error) };
  }
};

const describeTokenError = (error: GithubAppRequestError, repoIdentifier: string): Credential => {
  switch (error.status) {
    case null:
      return failure(error.message, true);
    case 401:
      return failure(REJECTED_CREDENTIALS);
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

const mintCredential = async (
  config: GithubAppConfig,
  installationId: number,
  repositoryId: number,
  repoIdentifier: string,
): Promise<Credential> => {
  const scope = statusesScope(repositoryId);

  try {
    return {
      ok: true,
      token: await getInstallationToken(config, installationId, scope),
      renew: () => {
        invalidateInstallationToken(config, installationId, scope);
        return mintCredential(config, installationId, repositoryId, repoIdentifier);
      },
    };
  } catch (error) {
    if (error instanceof GithubAppRequestError) {
      return describeTokenError(error, repoIdentifier);
    }
    throw error;
  }
};

const credential: GitConnections["credential"] = async (
  connectionId,
  repositoryId,
  repoIdentifier,
) => {
  const loaded = loadConfig();
  if ("notConfigured" in loaded) {
    return failure(NOT_CONFIGURED);
  }
  if ("error" in loaded) {
    return failure(loaded.error);
  }

  const installationId = parseId(connectionId);
  const numericRepositoryId = parseId(repositoryId);
  if (installationId === null || numericRepositoryId === null) {
    return failure("the integration's github app installation is invalid, link it again");
  }

  return mintCredential(loaded.config, installationId, numericRepositoryId, repoIdentifier);
};

const repositoryIdSchema = z.object({ id: z.number() });

const verify: GitConnections["verify"] = async (
  repoIdentifier,
  repositoryId,
  token,
): Promise<VerifyOutcome> => {
  try {
    const response = await fetch(`${githubApiUrl()}/repos/${repoIdentifier}`, {
      headers: githubHeaders(token),
    });
    if (!response.ok) {
      return {
        ok: false,
        httpStatus: response.status,
        error: `provider responded with ${response.status}`,
      };
    }

    // Minting the token already proved the installation grants statuses on this repository id.
    // Check the stored name still points at it, so statuses don't land on a recreated namesake.
    const parsed = repositoryIdSchema.safeParse(await response.json().catch(() => null));
    if (!parsed.success || String(parsed.data.id) !== repositoryId) {
      return {
        ok: false,
        httpStatus: response.status,
        error: "the repository name now points at a different repository, link it again",
      };
    }

    return { ok: true, httpStatus: response.status, error: null };
  } catch (error) {
    return {
      ok: false,
      httpStatus: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const githubAppConnections: GitConnections = {
  label: "github app",
  setupGuideUrl: SETUP_GUIDE_URL,
  isConfigured: () => "config" in loadConfig(),
  status,
  searchRepositories,
  getRepository,
  credential,
  verify,
};
