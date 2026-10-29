import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { findInstallationRepository, listAppRepositories } from "../../githubApp/repositories";
import { clearInstallationTokens } from "../../githubApp/tokens";
import { server } from "../setup";
import { TEST_PRIVATE_KEY_PEM } from "./testKeys";

const API = "https://api.github.com";

const configureApp = () => {
  vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "Iv23liExample");
  vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", TEST_PRIVATE_KEY_PEM);
};

const installation = (id: number, login: string, suspended = false) => ({
  id,
  account: { login, type: "Organization" },
  html_url: `https://github.com/organizations/${login}/settings/installations/${id}`,
  repository_selection: "selected",
  permissions: { statuses: "write", metadata: "read" },
  suspended_at: suspended ? "2026-10-01T00:00:00Z" : null,
});

const repositoriesByToken: Record<string, { id: number; full_name: string; private: boolean }[]> = {
  ghs_42: [
    { id: 7, full_name: "acme/web", private: true },
    { id: 8, full_name: "acme/api", private: false },
  ],
  ghs_43: [{ id: 9, full_name: "acme-labs/app", private: true }],
};

const github = [
  http.post(`${API}/app/installations/:installationId/access_tokens`, ({ params }) =>
    HttpResponse.json(
      {
        token: `ghs_${String(params.installationId)}`,
        expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      },
      { status: 201 },
    ),
  ),
  http.get(`${API}/installation/repositories`, ({ request }) => {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
    return HttpResponse.json({ repositories: repositoriesByToken[token] ?? [] });
  }),
];

afterEach(() => {
  clearInstallationTokens();
});

describe("listAppRepositories", () => {
  it("reports when no app is configured", async () => {
    vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "");
    vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", "");

    expect(await listAppRepositories()).toEqual({ status: "not_configured" });
  });

  it("lists repositories across active installations, sorted by name", async () => {
    configureApp();
    server.use(
      ...github,
      http.get(`${API}/app/installations`, () =>
        HttpResponse.json([
          installation(42, "acme"),
          installation(43, "acme-labs"),
          installation(44, "suspended-org", true),
        ]),
      ),
    );

    expect(await listAppRepositories()).toEqual({
      status: "ok",
      repositories: [
        {
          installationId: 43,
          accountLogin: "acme-labs",
          id: 9,
          fullName: "acme-labs/app",
          private: true,
        },
        { installationId: 42, accountLogin: "acme", id: 8, fullName: "acme/api", private: false },
        { installationId: 42, accountLogin: "acme", id: 7, fullName: "acme/web", private: true },
      ],
    });
  });

  it("reports why github refused", async () => {
    configureApp();
    server.use(http.get(`${API}/app/installations`, () => new HttpResponse(null, { status: 401 })));

    expect(await listAppRepositories()).toMatchObject({
      status: "error",
      error: /rejected the app's credentials/,
    });
  });
});

describe("findInstallationRepository", () => {
  it("returns the repository's name when the installation has it", async () => {
    configureApp();
    server.use(...github);

    expect(await findInstallationRepository(42, 7)).toEqual({ fullName: "acme/web" });
  });

  it("refuses a repository from another installation", async () => {
    configureApp();
    server.use(...github);

    expect(await findInstallationRepository(42, 9)).toEqual({
      error: "the github app installation can't access that repository",
    });
  });

  it("refuses when no app is configured", async () => {
    vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "");
    vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", "");

    expect(await findInstallationRepository(42, 7)).toEqual({
      error: "github app is not configured on this instance",
    });
  });

  it("explains when the installation is gone", async () => {
    configureApp();
    server.use(
      http.post(
        `${API}/app/installations/42/access_tokens`,
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    expect(await findInstallationRepository(42, 7)).toEqual({ error: "github responded with 404" });
  });
});
