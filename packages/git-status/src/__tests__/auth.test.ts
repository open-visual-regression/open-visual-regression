import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { verifyIntegration } from "../auth";
import { encryptToken } from "../crypto";
import { describe, expect, test } from "./fixtures";
import { server } from "./setup";

const appIntegration = {
  provider: "github" as const,
  repoIdentifier: "acme/web",
  authType: "github_app" as const,
  encryptedToken: null,
};

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

  test("verifies an App integration installed with permission to write statuses", async ({
    github: _,
  }) => {
    await expect(verifyIntegration(appIntegration)).resolves.toEqual({
      ok: true,
      httpStatus: 200,
      error: null,
    });
  });

  test("explains when the App can only read statuses", async ({ github }) => {
    github.permissions = { statuses: "read", metadata: "read" };

    const result = await verifyIntegration(appIntegration);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/"Commit statuses: Read and write"/);
  });

  test("explains when the App is not installed on the repo", async ({ github }) => {
    github.installedOn = "someone-else";

    await expect(verifyIntegration(appIntegration)).resolves.toEqual({
      ok: false,
      httpStatus: 404,
      error: "the GitHub App is not installed on acme/web",
    });
  });

  test("explains when the deployment has no App", async () => {
    const result = await verifyIntegration(appIntegration);

    expect(result).toMatchObject({ ok: false, httpStatus: null });
    expect(result.error).toMatch(/set OVR_GITHUB_APP_ID and OVR_GITHUB_APP_PRIVATE_KEY/);
  });

  test("explains when the deployment's App is half configured", async () => {
    vi.stubEnv("OVR_GITHUB_APP_ID", "1234");

    const result = await verifyIntegration(appIntegration);

    expect(result.error).toMatch(/OVR_GITHUB_APP_ID is set but OVR_GITHUB_APP_PRIVATE_KEY is not/);
  });
});
