import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { resolveToken, verifyIntegration } from "../auth";
import { encryptToken } from "../crypto";
import { describe, expect, test } from "./fixtures";
import { server } from "./setup";

describe("auth", () => {
  test("verifies a token integration can push to the repo, using the decrypted token", async ({
    encryptionKey: _,
  }) => {
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

  test("explains when the stored token can't be decrypted", async ({ encryptionKey: _ }) => {
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

  test("refuses an auth type the provider doesn't support", async () => {
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
});
