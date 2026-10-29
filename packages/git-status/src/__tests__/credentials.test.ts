import { randomBytes } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveCredential, type IntegrationCredentials } from "../credentials";
import { encryptToken } from "../crypto";
import { clearInstallationTokens } from "../providers/github/app/tokens";
import { TEST_CLIENT_ID, useFakeGithub } from "./providers/github/app/fakeGithub";
import { TEST_PRIVATE_KEY_PEM } from "./providers/github/app/testKeys";

const accessToken: IntegrationCredentials = {
  provider: "github",
  repoIdentifier: "acme/web",
  credentialType: "access_token",
  encryptedToken: null,
  connectionId: null,
  externalRepoId: null,
};

const connection: IntegrationCredentials = {
  ...accessToken,
  credentialType: "connection",
  connectionId: "42",
  externalRepoId: "7",
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

  describe("connection", () => {
    it("asks the integration's provider for a token", async () => {
      vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", TEST_CLIENT_ID);
      vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", TEST_PRIVATE_KEY_PEM);
      useFakeGithub();

      expect(await resolveCredential(connection)).toMatchObject({ ok: true });
    });

    it("fails when the integration has lost its connection", async () => {
      expect(await resolveCredential({ ...connection, connectionId: null })).toEqual({
        ok: false,
        error: "the integration is missing its connection, link it again",
        retryable: false,
      });
    });
  });
});
