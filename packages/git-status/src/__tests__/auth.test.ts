import { randomBytes } from "node:crypto";

import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";

import { resolveToken, verifyIntegration } from "../auth";
import { encryptToken } from "../crypto";
import { server } from "./setup";

const ENCRYPTION_KEY = randomBytes(32).toString("base64");

it("verifies a token integration with the decrypted token that it can push to the repo", async () => {
  vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", ENCRYPTION_KEY);
  const authorization = vi.fn<(header: string | null) => void>();
  server.use(
    http.get("https://api.github.com/repos/acme/web", ({ request }) => {
      authorization(request.headers.get("authorization"));
      return HttpResponse.json({ permissions: { push: true } });
    }),
  );

  const result = await verifyIntegration({
    provider: "github",
    repoIdentifier: "acme/web",
    authType: "token",
    encryptedToken: encryptToken("ghp_secret"),
  });

  expect(result).toEqual({ ok: true, httpStatus: 200, error: null });
  expect(authorization).toHaveBeenCalledWith("Bearer ghp_secret");
});

it("explains when the stored token can't be decrypted", async () => {
  vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", ENCRYPTION_KEY);

  const result = await verifyIntegration({
    provider: "github",
    repoIdentifier: "acme/web",
    authType: "token",
    encryptedToken: "not-a-ciphertext",
  });

  expect(result).toEqual({
    ok: false,
    httpStatus: null,
    error: "stored token could not be decrypted, re-enter it",
  });
});

it("refuses an auth type the provider doesn't support", async () => {
  const result = await resolveToken({
    provider: "github",
    repoIdentifier: "acme/web",
    authType: "github_app",
    encryptedToken: null,
  });

  expect(result).toEqual({
    ok: false,
    error: "github_app authentication is not supported for github",
    retryable: false,
  });
});
