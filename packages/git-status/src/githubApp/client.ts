import { z } from "zod";

import { githubApiUrl, githubHeaders } from "../githubApi";
import type { GithubAppConfig } from "./config";
import { createAppJwt } from "./jwt";

const PAGE_SIZE = 100;

export class GithubAppRequestError extends Error {
  constructor(
    readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = "GithubAppRequestError";
  }
}

const request = async <T>(
  path: string,
  token: string,
  schema: z.ZodType<T>,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${githubApiUrl()}${path}`, {
      method: init.method ?? "GET",
      headers: {
        ...githubHeaders(token),
        ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new GithubAppRequestError(null, `could not reach github: ${detail}`);
  }

  if (!response.ok) {
    throw new GithubAppRequestError(response.status, `github responded with ${response.status}`);
  }

  const parsed = schema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    throw new GithubAppRequestError(response.status, "github returned an unexpected response");
  }

  return parsed.data;
};

const paginate = async <T>(path: string, token: string, schema: z.ZodType<T[]>): Promise<T[]> => {
  const items: T[] = [];
  const separator = path.includes("?") ? "&" : "?";

  for (let page = 1; ; page++) {
    const batch = await request(
      `${path}${separator}per_page=${PAGE_SIZE}&page=${page}`,
      token,
      schema,
    );
    items.push(...batch);
    if (batch.length < PAGE_SIZE) {
      return items;
    }
  }
};

const permissionsSchema = z.record(z.string(), z.string());

const appSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    html_url: z.string(),
    owner: z.object({ login: z.string() }).nullable(),
    permissions: permissionsSchema,
  })
  .transform((app) => ({
    slug: app.slug,
    name: app.name,
    htmlUrl: app.html_url,
    ownerLogin: app.owner?.login ?? null,
    permissions: app.permissions,
  }));

export type GithubApp = z.infer<typeof appSchema>;

/** The app registration itself: its name, owner, and the permissions it asks for. */
export const getApp = (config: GithubAppConfig): Promise<GithubApp> =>
  request("/app", createAppJwt(config), appSchema);

const installationSchema = z
  .object({
    id: z.number(),
    account: z.object({ login: z.string(), type: z.string() }).nullable(),
    html_url: z.string(),
    repository_selection: z.enum(["all", "selected"]),
    permissions: permissionsSchema,
    suspended_at: z.string().nullable().optional(),
  })
  .transform((installation) => ({
    id: installation.id,
    accountLogin: installation.account?.login ?? null,
    accountType: installation.account?.type ?? null,
    htmlUrl: installation.html_url,
    repositorySelection: installation.repository_selection,
    permissions: installation.permissions,
    suspended: Boolean(installation.suspended_at),
  }));

export type GithubAppInstallation = z.infer<typeof installationSchema>;

/** Every account the app is installed on. */
export const listInstallations = (config: GithubAppConfig): Promise<GithubAppInstallation[]> =>
  paginate("/app/installations", createAppJwt(config), z.array(installationSchema));

export type InstallationTokenScope = {
  repositoryIds?: number[];
  permissions: Record<string, "read" | "write">;
};

const installationTokenSchema = z
  .object({ token: z.string(), expires_at: z.string() })
  .transform((token) => ({ token: token.token, expiresAt: Date.parse(token.expires_at) }));

export type InstallationToken = z.infer<typeof installationTokenSchema>;

/**
 * Mints an installation access token narrowed to the given repositories and permissions.
 * GitHub refuses the request when the installation can't grant them.
 */
export const createInstallationToken = (
  config: GithubAppConfig,
  installationId: number,
  scope: InstallationTokenScope,
): Promise<InstallationToken> =>
  request(
    `/app/installations/${installationId}/access_tokens`,
    createAppJwt(config),
    installationTokenSchema,
    {
      method: "POST",
      body: { repository_ids: scope.repositoryIds, permissions: scope.permissions },
    },
  );

const repositorySchema = z
  .object({ id: z.number(), full_name: z.string(), private: z.boolean() })
  .transform((repository) => ({
    id: repository.id,
    fullName: repository.full_name,
    private: repository.private,
  }));

export type GithubAppRepository = z.infer<typeof repositorySchema>;

const repositoriesPageSchema = z
  .object({ repositories: z.array(repositorySchema) })
  .transform((page) => page.repositories);

/** The repositories an installation token can reach. */
export const listInstallationRepositories = (token: string): Promise<GithubAppRepository[]> =>
  paginate("/installation/repositories", token, repositoriesPageSchema);
