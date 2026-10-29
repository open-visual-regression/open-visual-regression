import { randomBytes } from "node:crypto";

import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveCredential, type IntegrationCredentials } from "../credentials";
import { encryptToken } from "../crypto";
import { clearInstallationTokens } from "../githubApp/tokens";
import { TEST_PRIVATE_KEY_PEM } from "./githubApp/testKeys";
import { server } from "./setup";

const API = "https://api.github.com";

const accessToken: IntegrationCredentials = {
  provider: "github",
  repoIdentifier: "acme/web",
  authType: "access_token",
  encryptedToken: null,
  githubInstallationId: null,
  externalRepoId: null,
};

const githubApp: IntegrationCredentials = {
  ...accessToken,
  authType: "github_app",
  githubInstallationId: 42,
  externalRepoId: 7,
};

const configureApp = () => {
  vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "Iv23liExample");
  vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", TEST_PRIVATE_KEY_PEM);
};

const mintTokens = () => {
  const requests: unknown[] = [];
  server.use(
    http.post(`${API}/app/installations/42/access_tokens`, async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json(
        {
          token: `ghs_${requests.length}`,
          expires_at: new Date(Date.now() + 3_600_000).toISOString(),
        },
        { status: 201 },
      );
    }),
  );
  return requests;
};

beforeEach(() => {
  vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
});

afterEach(() => {
  clearInstallationTokens();
});

describe("resolveCredential", () => {
  describe("access token", () => {
    it("decrypts the stored token", async () => {
      const credential = await resolveCredential({
        ...accessToken,
        encryptedToken: encryptToken("ghp_secret"),
      });
      expect(credential).toEqual({ ok: true, token: "ghp_secret", renew: null });
    });

    it("fails when no token is stored", async () => {
      expect(await resolveCredential(accessToken)).toEqual({
        ok: false,
        error: "no access token is stored, enter one",
        retryable: false,
      });
    });

    it("fails when the token can't be decrypted", async () => {
      const credential = await resolveCredential({ ...accessToken, encryptedToken: "garbage" });
      expect(credential).toMatchObject({ ok: false, error: /could not be decrypted/ });
    });
  });

  describe("github app", () => {
    it("fails when no app is configured", async () => {
      vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "");
      vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", "");
      expect(await resolveCredential(githubApp)).toEqual({
        ok: false,
        error: "github app is not configured on this instance",
        retryable: false,
      });
    });

    it("fails when the app is misconfigured", async () => {
      vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "Iv23liExample");
      vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", "");
      expect(await resolveCredential(githubApp)).toMatchObject({
        ok: false,
        error: /OVR_GITHUB_APP_PRIVATE_KEY is required/,
      });
    });

    it("mints a token scoped to the repository's commit statuses", async () => {
      configureApp();
      const requests = mintTokens();

      expect(await resolveCredential(githubApp)).toMatchObject({ ok: true, token: "ghs_1" });
      expect(requests).toEqual([
        { repository_ids: [7], permissions: { statuses: "write", metadata: "read" } },
      ]);
    });

    it("renews by minting a fresh token instead of the cached one", async () => {
      configureApp();
      mintTokens();

      const first = await resolveCredential(githubApp);
      expect(await resolveCredential(githubApp)).toMatchObject({ token: "ghs_1" });
      if (!first.ok || !first.renew) {
        throw new Error("expected a renewable credential");
      }
      expect(await first.renew()).toMatchObject({ ok: true, token: "ghs_2" });
    });

    it.each([
      [401, /rejected the app's credentials/, false],
      [404, /no longer installed/, false],
      [403, /can't write commit statuses to acme\/web/, false],
      [422, /can't write commit statuses to acme\/web/, false],
      [500, /github responded with 500/, true],
      [429, /github responded with 429/, true],
    ])("explains a %i from github", async (status, error, retryable) => {
      configureApp();
      server.use(
        http.post(
          `${API}/app/installations/42/access_tokens`,
          () => new HttpResponse(null, { status }),
        ),
      );

      expect(await resolveCredential(githubApp)).toMatchObject({ ok: false, error, retryable });
    });

    it("retries when github can't be reached", async () => {
      configureApp();
      server.use(
        http.post(`${API}/app/installations/42/access_tokens`, () => HttpResponse.error()),
      );

      expect(await resolveCredential(githubApp)).toMatchObject({ ok: false, retryable: true });
    });
  });
});
