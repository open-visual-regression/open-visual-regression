import { verify } from "node:crypto";

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import {
  createInstallationToken,
  getApp,
  GithubAppRequestError,
  listInstallationRepositories,
  listInstallations,
} from "../../githubApp/client";
import { server } from "../setup";
import { TEST_PRIVATE_KEY, TEST_PUBLIC_KEY } from "./testKeys";

const API = "https://api.github.com";
const config = { clientId: "Iv23liExample", privateKey: TEST_PRIVATE_KEY };

const isAppJwt = (authorization: string | null) => {
  const [header, payload, signature] = authorization?.replace(/^Bearer /, "").split(".") ?? [];
  if (!header || !payload || !signature) {
    return false;
  }
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as { iss: string };
  return (
    claims.iss === config.clientId &&
    verify(
      "RSA-SHA256",
      Buffer.from(`${header}.${payload}`),
      TEST_PUBLIC_KEY,
      Buffer.from(signature, "base64url"),
    )
  );
};

const installation = (id: number, login: string) => ({
  id,
  account: { login, type: "Organization" },
  html_url: `https://github.com/organizations/${login}/settings/installations/${id}`,
  repository_selection: "selected",
  permissions: { statuses: "write", metadata: "read" },
  suspended_at: null,
});

describe("getApp", () => {
  it("authenticates as the app and returns its registration", async () => {
    server.use(
      http.get(`${API}/app`, ({ request }) => {
        if (!isAppJwt(request.headers.get("authorization"))) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json({
          slug: "acme-ovr",
          name: "acme-ovr",
          html_url: "https://github.com/apps/acme-ovr",
          owner: { login: "acme" },
          permissions: { statuses: "write", metadata: "read" },
        });
      }),
    );

    expect(await getApp(config)).toEqual({
      slug: "acme-ovr",
      name: "acme-ovr",
      htmlUrl: "https://github.com/apps/acme-ovr",
      ownerLogin: "acme",
      permissions: { statuses: "write", metadata: "read" },
    });
  });

  it("uses OVR_GITHUB_API_URL when it is set", async () => {
    vi.stubEnv("OVR_GITHUB_API_URL", "http://github.test");
    server.use(
      http.get("http://github.test/app", () =>
        HttpResponse.json({
          slug: "acme-ovr",
          name: "acme-ovr",
          html_url: "https://github.com/apps/acme-ovr",
          owner: null,
          permissions: {},
        }),
      ),
    );

    expect((await getApp(config)).ownerLogin).toBeNull();
  });

  it("throws the status github responded with", async () => {
    server.use(http.get(`${API}/app`, () => new HttpResponse(null, { status: 401 })));

    const error = await getApp(config).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(GithubAppRequestError);
    expect(error).toMatchObject({ status: 401, message: "github responded with 401" });
  });

  it("throws when github returns something unexpected", async () => {
    server.use(http.get(`${API}/app`, () => HttpResponse.json({ nope: true })));

    await expect(getApp(config)).rejects.toMatchObject({
      status: 200,
      message: "github returned an unexpected response",
    });
  });

  it("throws without a status when github can't be reached", async () => {
    server.use(http.get(`${API}/app`, () => HttpResponse.error()));

    await expect(getApp(config)).rejects.toMatchObject({ status: null });
  });
});

describe("listInstallations", () => {
  it("returns every installation across pages", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) =>
      installation(index + 1, `org-${index}`),
    );
    server.use(
      http.get(`${API}/app/installations`, ({ request }) => {
        if (!isAppJwt(request.headers.get("authorization"))) {
          return new HttpResponse(null, { status: 401 });
        }
        const page = new URL(request.url).searchParams.get("page");
        return HttpResponse.json(page === "1" ? firstPage : [installation(101, "acme")]);
      }),
    );

    const installations = await listInstallations(config);
    expect(installations).toHaveLength(101);
    expect(installations.at(-1)).toEqual({
      id: 101,
      accountLogin: "acme",
      accountType: "Organization",
      htmlUrl: "https://github.com/organizations/acme/settings/installations/101",
      repositorySelection: "selected",
      permissions: { statuses: "write", metadata: "read" },
      suspended: false,
    });
  });
});

describe("createInstallationToken", () => {
  it("asks for a token narrowed to the repositories and permissions", async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/app/installations/42/access_tokens`, async ({ request }) => {
        if (!isAppJwt(request.headers.get("authorization"))) {
          return new HttpResponse(null, { status: 401 });
        }
        body = await request.json();
        return HttpResponse.json(
          { token: "ghs_minted", expires_at: "2026-10-29T13:00:00Z" },
          { status: 201 },
        );
      }),
    );

    const token = await createInstallationToken(config, 42, {
      repositoryIds: [7],
      permissions: { statuses: "write" },
    });

    expect(body).toEqual({ repository_ids: [7], permissions: { statuses: "write" } });
    expect(token).toEqual({ token: "ghs_minted", expiresAt: Date.UTC(2026, 9, 29, 13) });
  });
});

describe("listInstallationRepositories", () => {
  it("lists the repositories the installation token can reach", async () => {
    server.use(
      http.get(`${API}/installation/repositories`, ({ request }) => {
        if (request.headers.get("authorization") !== "Bearer ghs_installation") {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json({
          total_count: 1,
          repositories: [{ id: 7, full_name: "acme/web", private: true }],
        });
      }),
    );

    expect(await listInstallationRepositories("ghs_installation")).toEqual([
      { id: 7, fullName: "acme/web", private: true },
    ]);
  });
});
