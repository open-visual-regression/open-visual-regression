import { randomBytes } from "node:crypto";

import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { IntegrationCredentials } from "../credentials";
import { encryptToken } from "../crypto";
import { clearInstallationTokens } from "../providers/github/app/tokens";
import { verifyIntegration } from "../verifyIntegration";
import { TEST_CLIENT_ID, useFakeGithub } from "./providers/github/app/fakeGithub";
import { TEST_PRIVATE_KEY_PEM } from "./providers/github/app/testKeys";
import { server } from "./setup";

const connection: IntegrationCredentials = {
  provider: "github",
  repoIdentifier: "acme/web",
  credentialType: "connection",
  encryptedToken: null,
  connectionId: "42",
  externalRepoId: "7",
};

const configureApp = () => {
  vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", TEST_CLIENT_ID);
  vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", TEST_PRIVATE_KEY_PEM);
};

afterEach(() => {
  clearInstallationTokens();
});

const integration = (encryptedToken: string | null): IntegrationCredentials => ({
  provider: "github",
  repoIdentifier: "acme/web",
  credentialType: "access_token",
  encryptedToken,
  connectionId: null,
  externalRepoId: null,
});

describe("verifyIntegration", () => {
  it("checks the token through the integration's provider", async () => {
    vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
    server.use(
      http.get("https://api.github.com/repos/acme/web", ({ request }) =>
        request.headers.get("authorization") === "Bearer ghp_secret"
          ? HttpResponse.json({ permissions: { push: true } })
          : new HttpResponse(null, { status: 401 }),
      ),
    );

    expect(await verifyIntegration(integration(encryptToken("ghp_secret")))).toEqual({
      ok: true,
      httpStatus: 200,
      error: null,
    });
  });

  it("explains why there is no credential to check", async () => {
    expect(await verifyIntegration(integration(null))).toEqual({
      ok: false,
      httpStatus: null,
      error: "no access token is stored, enter one",
    });
  });

  it("checks a connection through the provider's connections", async () => {
    configureApp();
    useFakeGithub();

    expect(await verifyIntegration(connection)).toEqual({ ok: true, httpStatus: 200, error: null });
  });

  it("retries with a fresh token when the provider revoked the cached one", async () => {
    configureApp();
    const fake = useFakeGithub();
    await verifyIntegration(connection);

    // Forgetting every token it issued is what a reinstall looks like to OVR.
    fake.reset();

    expect(await verifyIntegration(connection)).toMatchObject({ ok: true });
    expect(fake.requests().tokenRequests).toHaveLength(1);
  });

  it("reports why no connection token could be minted", async () => {
    configureApp();
    const fake = useFakeGithub();
    fake.failNext({ method: "POST", path: "/app/installations/42/access_tokens", status: 422 });

    expect(await verifyIntegration(connection)).toEqual({
      ok: false,
      httpStatus: null,
      error:
        "the github app can't write commit statuses to acme/web, check the installation's repositories and permissions",
    });
  });
});
