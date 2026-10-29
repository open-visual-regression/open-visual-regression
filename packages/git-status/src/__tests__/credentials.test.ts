import { randomBytes } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveCredential, type IntegrationCredentials } from "../credentials";
import { encryptToken } from "../crypto";

const accessToken: IntegrationCredentials = {
  provider: "github",
  repoIdentifier: "acme/web",
  credentialType: "access_token",
  encryptedToken: null,
  connectionId: null,
  externalRepoId: null,
};

beforeEach(() => {
  vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
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
});
