import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getGithubAppStatus } from "../../githubApp/status";
import { clearInstallationTokens } from "../../githubApp/tokens";
import { server } from "../setup";
import { TEST_PRIVATE_KEY_PEM } from "./testKeys";

const API = "https://api.github.com";

const configureApp = () => {
  vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "Iv23liExample");
  vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", TEST_PRIVATE_KEY_PEM);
};

const app = http.get(`${API}/app`, () =>
  HttpResponse.json({
    slug: "acme-ovr",
    name: "acme-ovr",
    html_url: "https://github.com/apps/acme-ovr",
    owner: { login: "acme" },
    permissions: { statuses: "write", metadata: "read" },
  }),
);

const installation = (id: number, login: string, suspended = false) => ({
  id,
  account: { login, type: "Organization" },
  html_url: `https://github.com/organizations/${login}/settings/installations/${id}`,
  repository_selection: "selected",
  permissions: { statuses: "write", metadata: "read" },
  suspended_at: suspended ? "2026-10-01T00:00:00Z" : null,
});

const tokens = http.post(`${API}/app/installations/:installationId/access_tokens`, ({ params }) =>
  HttpResponse.json(
    {
      token: `ghs_${String(params.installationId)}`,
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    },
    { status: 201 },
  ),
);

afterEach(() => {
  clearInstallationTokens();
});

describe("getGithubAppStatus", () => {
  it("reports when no app is configured", async () => {
    vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "");
    vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", "");

    expect(await getGithubAppStatus()).toEqual({ status: "not_configured" });
  });

  it("reports a misconfigured app as an error", async () => {
    vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "Iv23liExample");
    vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", "");

    expect(await getGithubAppStatus()).toMatchObject({
      status: "error",
      error: /OVR_GITHUB_APP_PRIVATE_KEY is required/,
    });
  });

  it("returns the app and its installations with their repository counts", async () => {
    configureApp();
    server.use(
      app,
      tokens,
      http.get(`${API}/app/installations`, () =>
        HttpResponse.json([installation(42, "acme"), installation(43, "acme-labs", true)]),
      ),
      http.get(`${API}/installation/repositories`, () =>
        HttpResponse.json({
          total_count: 2,
          repositories: [
            { id: 7, full_name: "acme/web", private: true },
            { id: 8, full_name: "acme/docs", private: false },
          ],
        }),
      ),
    );

    expect(await getGithubAppStatus()).toEqual({
      status: "ok",
      app: {
        name: "acme-ovr",
        htmlUrl: "https://github.com/apps/acme-ovr",
        installUrl: "https://github.com/apps/acme-ovr/installations/new",
        ownerLogin: "acme",
        permissions: { statuses: "write", metadata: "read" },
      },
      installations: [
        {
          id: 42,
          accountLogin: "acme",
          accountType: "Organization",
          htmlUrl: "https://github.com/organizations/acme/settings/installations/42",
          repositorySelection: "selected",
          repositoryCount: 2,
          suspended: false,
        },
        {
          id: 43,
          accountLogin: "acme-labs",
          accountType: "Organization",
          htmlUrl: "https://github.com/organizations/acme-labs/settings/installations/43",
          repositorySelection: "selected",
          repositoryCount: null,
          suspended: true,
        },
      ],
    });
  });

  it("leaves the repository count empty when it can't be listed", async () => {
    configureApp();
    server.use(
      app,
      http.get(`${API}/app/installations`, () => HttpResponse.json([installation(42, "acme")])),
      http.post(
        `${API}/app/installations/42/access_tokens`,
        () => new HttpResponse(null, { status: 403 }),
      ),
    );

    expect(await getGithubAppStatus()).toMatchObject({
      status: "ok",
      installations: [{ id: 42, repositoryCount: null }],
    });
  });

  it("explains rejected app credentials", async () => {
    configureApp();
    server.use(
      http.get(`${API}/app`, () => new HttpResponse(null, { status: 401 })),
      http.get(`${API}/app/installations`, () => new HttpResponse(null, { status: 401 })),
    );

    expect(await getGithubAppStatus()).toEqual({
      status: "error",
      error:
        "github rejected the app's credentials, check OVR_GITHUB_APP_CLIENT_ID and OVR_GITHUB_APP_PRIVATE_KEY",
    });
  });
});
