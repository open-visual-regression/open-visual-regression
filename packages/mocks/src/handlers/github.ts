import { createPublicKey, randomBytes, verify, type KeyObject } from "node:crypto";

import { http, HttpResponse, type HttpHandler } from "msw";

// A stateful stand-in for the slice of the GitHub REST API that OVR's GitHub App support
// calls. It checks app JWTs against the app's public key and only honours installation
// tokens it minted, scoped the way they were requested. Unit tests mount `handlers` on
// their msw server. The E2E suite serves the same handlers, plus `controlHandlers`, over
// HTTP so specs can inspect and steer it.

export type FakeGithubRepository = { id: number; fullName: string; private: boolean };

export type FakeGithubInstallation = {
  id: number;
  account: { login: string; type: "Organization" | "User" };
  repositorySelection?: "all" | "selected";
  permissions?: Record<string, "read" | "write">;
  suspended?: boolean;
  repositories: FakeGithubRepository[];
};

export type FakeGithubOptions = {
  baseUrl?: string;
  clientId: string;
  publicKey: KeyObject | string;
  app?: {
    slug?: string;
    name?: string;
    ownerLogin?: string;
    permissions?: Record<string, "read" | "write">;
  };
  installations?: FakeGithubInstallation[];
  now?: () => number;
};

export type FakeGithubTokenRequest = {
  installationId: number;
  repository_ids?: number[];
  permissions?: Record<string, string>;
};

export type FakeGithubStatus = {
  repository: string;
  sha: string;
  token: string;
  state: string;
  context: string;
  description: string;
  target_url: string;
};

export type FakeGithubRequests = {
  tokenRequests: FakeGithubTokenRequest[];
  statuses: FakeGithubStatus[];
};

export type FakeGithubFailure = { method: string; path: string; status: number };

type IssuedToken = {
  installationId: number;
  repositoryIds: number[] | null;
  permissions: Record<string, string>;
  expiresAt: number;
};

const PERMISSIONS = { statuses: "write", metadata: "read" } as const;
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

export const DEFAULT_FAKE_GITHUB_INSTALLATIONS: FakeGithubInstallation[] = [
  {
    id: 42,
    account: { login: "acme", type: "Organization" },
    repositories: [
      { id: 7, fullName: "acme/web", private: true },
      { id: 8, fullName: "acme/api", private: false },
    ],
  },
];

const bearer = (request: Request) =>
  request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";

const unauthorized = () => HttpResponse.json({ message: "Bad credentials" }, { status: 401 });

const notFound = () => HttpResponse.json({ message: "Not Found" }, { status: 404 });

const page = <T>(items: T[], url: URL): T[] => {
  const perPage = Number(url.searchParams.get("per_page") ?? 30);
  const pageNumber = Number(url.searchParams.get("page") ?? 1);
  return items.slice((pageNumber - 1) * perPage, pageNumber * perPage);
};

const grantable = (granted: Record<string, string>, requested: Record<string, string>): boolean =>
  Object.entries(requested).every(
    ([name, level]) => granted[name] === "write" || (granted[name] === "read" && level === "read"),
  );

export const createFakeGithub = (options: FakeGithubOptions) => {
  const baseUrl = (options.baseUrl ?? "https://api.github.com").replace(/\/+$/, "");
  const publicKey =
    typeof options.publicKey === "string" ? createPublicKey(options.publicKey) : options.publicKey;
  const installations = options.installations ?? DEFAULT_FAKE_GITHUB_INSTALLATIONS;
  const now = options.now ?? Date.now;

  let tokens = new Map<string, IssuedToken>();
  let requests: FakeGithubRequests = { tokenRequests: [], statuses: [] };
  let failures: FakeGithubFailure[] = [];

  const isAppJwt = (token: string): boolean => {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) {
      return false;
    }
    const signed = verify(
      "RSA-SHA256",
      Buffer.from(`${header}.${payload}`),
      publicKey,
      Buffer.from(signature, "base64url"),
    );
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      iss?: string;
      exp?: number;
    };
    const nowSeconds = Math.floor(now() / 1000);
    return (
      signed &&
      claims.iss === options.clientId &&
      typeof claims.exp === "number" &&
      claims.exp > nowSeconds &&
      claims.exp - nowSeconds <= 600
    );
  };

  const installationToken = (request: Request) => {
    const token = tokens.get(bearer(request));
    return token && token.expiresAt > now() ? token : null;
  };

  const repositoriesFor = (token: IssuedToken) => {
    const installation = installations.find(({ id }) => id === token.installationId);
    return (installation?.repositories ?? []).filter(
      (repository) => !token.repositoryIds || token.repositoryIds.includes(repository.id),
    );
  };

  const findRepository = (token: IssuedToken, owner: string, repo: string) =>
    repositoriesFor(token).find(({ fullName }) => fullName === `${owner}/${repo}`);

  // An injected failure answers the next matching request instead of the real handler.
  const injected = (request: Request) => {
    const { pathname } = new URL(request.url);
    const index = failures.findIndex(
      (failure) => failure.method === request.method && pathname.startsWith(failure.path),
    );
    if (index === -1) {
      return undefined;
    }
    const [failure] = failures.splice(index, 1);
    return HttpResponse.json({ message: "injected failure" }, { status: failure!.status });
  };

  const installationJson = (installation: FakeGithubInstallation) => ({
    id: installation.id,
    account: installation.account,
    html_url: `https://github.com/organizations/${installation.account.login}/settings/installations/${installation.id}`,
    repository_selection: installation.repositorySelection ?? "selected",
    permissions: installation.permissions ?? PERMISSIONS,
    suspended_at: installation.suspended ? "2026-01-01T00:00:00Z" : null,
  });

  const handlers: HttpHandler[] = [
    http.all(`${baseUrl}/*`, ({ request }) => injected(request)),
    http.get(`${baseUrl}/app`, ({ request }) => {
      if (!isAppJwt(bearer(request))) {
        return unauthorized();
      }
      const slug = options.app?.slug ?? "acme-ovr";
      return HttpResponse.json({
        slug,
        name: options.app?.name ?? slug,
        html_url: `https://github.com/apps/${slug}`,
        owner: { login: options.app?.ownerLogin ?? "acme" },
        permissions: options.app?.permissions ?? PERMISSIONS,
      });
    }),
    http.get(`${baseUrl}/app/installations`, ({ request }) => {
      if (!isAppJwt(bearer(request))) {
        return unauthorized();
      }
      return HttpResponse.json(page(installations.map(installationJson), new URL(request.url)));
    }),
    http.post<{ installationId: string }>(
      `${baseUrl}/app/installations/:installationId/access_tokens`,
      async ({ request, params }) => {
        if (!isAppJwt(bearer(request))) {
          return unauthorized();
        }
        const installation = installations.find(({ id }) => id === Number(params.installationId));
        if (!installation) {
          return notFound();
        }

        const body = (await request.json().catch(() => ({}))) as Omit<
          FakeGithubTokenRequest,
          "installationId"
        >;
        requests.tokenRequests.push({ installationId: installation.id, ...body });

        if (installation.suspended) {
          return HttpResponse.json({ message: "installation suspended" }, { status: 403 });
        }
        const repositoryIds = body.repository_ids ?? null;
        if (
          repositoryIds &&
          !repositoryIds.every((id) => installation.repositories.some((repo) => repo.id === id))
        ) {
          return HttpResponse.json(
            { message: "repository is not accessible to the installation" },
            { status: 422 },
          );
        }
        const granted = installation.permissions ?? PERMISSIONS;
        const permissions = body.permissions ?? granted;
        if (!grantable(granted, permissions)) {
          return HttpResponse.json({ message: "permissions can't be granted" }, { status: 422 });
        }

        // Unique like GitHub's, so a response cached for an old token never answers for a new one.
        const token = `ghs_fake_${randomBytes(16).toString("hex")}`;
        const expiresAt = now() + TOKEN_LIFETIME_MS;
        tokens.set(token, {
          installationId: installation.id,
          repositoryIds,
          permissions,
          expiresAt,
        });
        return HttpResponse.json(
          { token, expires_at: new Date(expiresAt).toISOString(), permissions },
          { status: 201 },
        );
      },
    ),
    http.get(`${baseUrl}/installation/repositories`, ({ request }) => {
      const token = installationToken(request);
      if (!token) {
        return unauthorized();
      }
      const repositories = repositoriesFor(token).map((repository) => ({
        id: repository.id,
        full_name: repository.fullName,
        private: repository.private,
      }));
      return HttpResponse.json({
        total_count: repositories.length,
        repositories: page(repositories, new URL(request.url)),
      });
    }),
    http.get<{ owner: string; repo: string }>(
      `${baseUrl}/repos/:owner/:repo`,
      ({ request, params }) => {
        const token = installationToken(request);
        if (!token) {
          return unauthorized();
        }
        const repository = findRepository(token, params.owner, params.repo);
        return repository
          ? HttpResponse.json({ id: repository.id, full_name: repository.fullName })
          : notFound();
      },
    ),
    http.post<{ owner: string; repo: string; sha: string }>(
      `${baseUrl}/repos/:owner/:repo/statuses/:sha`,
      async ({ request, params }) => {
        const token = installationToken(request);
        if (!token) {
          return unauthorized();
        }
        const repository = findRepository(token, params.owner, params.repo);
        if (!repository) {
          return notFound();
        }
        if (token.permissions.statuses !== "write") {
          return HttpResponse.json(
            { message: "Resource not accessible by integration" },
            { status: 403 },
          );
        }
        const body = (await request.json()) as Omit<
          FakeGithubStatus,
          "repository" | "sha" | "token"
        >;
        requests.statuses.push({
          repository: repository.fullName,
          sha: params.sha,
          token: bearer(request),
          ...body,
        });
        return HttpResponse.json({ id: requests.statuses.length, ...body }, { status: 201 });
      },
    ),
  ];

  const reset = () => {
    tokens = new Map();
    requests = { tokenRequests: [], statuses: [] };
    failures = [];
  };

  const failNext = (failure: FakeGithubFailure) => {
    failures.push(failure);
  };

  // Lets a separate process (the E2E specs) inspect and steer a served fake.
  const controlHandlers: HttpHandler[] = [
    http.get(`${baseUrl}/__fake/requests`, () => HttpResponse.json(requests)),
    http.post(`${baseUrl}/__fake/reset`, () => {
      reset();
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${baseUrl}/__fake/fail-next`, async ({ request }) => {
      failNext((await request.json()) as FakeGithubFailure);
      return new HttpResponse(null, { status: 204 });
    }),
  ];

  return {
    handlers,
    controlHandlers,
    requests: () => requests,
    reset,
    failNext,
  };
};

export type FakeGithub = ReturnType<typeof createFakeGithub>;
