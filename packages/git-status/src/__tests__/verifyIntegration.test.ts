import { randomBytes } from "node:crypto";

import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { IntegrationCredentials } from "../credentials";
import { encryptToken } from "../crypto";
import { clearInstallationTokens } from "../githubApp/tokens";
import { verifyIntegration } from "../verifyIntegration";
import { TEST_PRIVATE_KEY_PEM } from "./githubApp/testKeys";
import { server } from "./setup";

const API = "https://api.github.com";

const githubApp: IntegrationCredentials = {
  provider: "github",
  repoIdentifier: "acme/web",
  authType: "github_app",
  encryptedToken: null,
  githubInstallationId: 42,
  externalRepoId: 7,
};

const configureApp = () => {
  vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "Iv23liExample");
  vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", TEST_PRIVATE_KEY_PEM);
  server.use(
    http.post(`${API}/app/installations/42/access_tokens`, () =>
      HttpResponse.json(
        { token: "ghs_scoped", expires_at: new Date(Date.now() + 3_600_000).toISOString() },
        { status: 201 },
      ),
    ),
  );
};

const repository = (id: number) =>
  http.get(`${API}/repos/acme/web`, ({ request }) =>
    request.headers.get("authorization") === "Bearer ghs_scoped"
      ? HttpResponse.json({ id, full_name: "acme/web" })
      : new HttpResponse(null, { status: 401 }),
  );

afterEach(() => {
  clearInstallationTokens();
});

describe("verifyIntegration", () => {
  it("checks an access token has push access", async () => {
    vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
    server.use(
      http.get(`${API}/repos/acme/web`, () => HttpResponse.json({ permissions: { push: false } })),
    );

    const result = await verifyIntegration({
      ...githubApp,
      authType: "access_token",
      encryptedToken: encryptToken("ghp_secret"),
      githubInstallationId: null,
      externalRepoId: null,
    });

    expect(result).toMatchObject({ ok: false, error: /cannot write commit statuses/ });
  });

  it("is ok when the app token reaches the linked repository", async () => {
    configureApp();
    server.use(repository(7));

    expect(await verifyIntegration(githubApp)).toEqual({ ok: true, httpStatus: 200, error: null });
  });

  it("fails when the repository name now points at a different repository", async () => {
    configureApp();
    server.use(repository(8));

    expect(await verifyIntegration(githubApp)).toMatchObject({
      ok: false,
      error: /points at a different repository/,
    });
  });

  it("reports why no token could be minted", async () => {
    configureApp();
    server.use(
      http.post(
        `${API}/app/installations/42/access_tokens`,
        () => new HttpResponse(null, { status: 422 }),
      ),
    );

    expect(await verifyIntegration(githubApp)).toEqual({
      ok: false,
      httpStatus: null,
      error:
        "the github app can't write commit statuses to acme/web, check the installation's repositories and permissions",
    });
  });

  it("retries with a fresh token when github rejects the cached one", async () => {
    vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "Iv23liExample");
    vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", TEST_PRIVATE_KEY_PEM);
    let minted = 0;
    server.use(
      http.post(`${API}/app/installations/42/access_tokens`, () => {
        minted += 1;
        return HttpResponse.json(
          { token: `ghs_${minted}`, expires_at: new Date(Date.now() + 3_600_000).toISOString() },
          { status: 201 },
        );
      }),
      http.get(`${API}/repos/acme/web`, ({ request }) =>
        request.headers.get("authorization") === "Bearer ghs_2"
          ? HttpResponse.json({ id: 7 })
          : new HttpResponse(null, { status: 401 }),
      ),
    );

    expect(await verifyIntegration(githubApp)).toEqual({ ok: true, httpStatus: 200, error: null });
    expect(minted).toBe(2);
  });
});
