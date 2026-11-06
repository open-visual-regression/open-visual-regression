import { describe, expect, it, vi } from "vitest";

import { GitHubAppConfigError } from "../githubApp/config";
import { GitHubAppError, type InstallationTokenProvider } from "../githubApp/installationTokens";
import { resolveToken, type ResolveTokenDeps, type TokenSource } from "../resolveToken";

const source: TokenSource = {
  provider: "github",
  repoIdentifier: "acme/web",
  authType: "token",
  encryptedToken: "encrypted",
};

const makeDeps = (
  decrypted: string | null,
  githubAppTokens: ResolveTokenDeps["githubAppTokens"] = () => null,
): ResolveTokenDeps => ({
  tryDecryptToken: vi.fn<ResolveTokenDeps["tryDecryptToken"]>().mockReturnValue(decrypted),
  githubAppTokens,
});

const appSource: TokenSource = { ...source, authType: "github_app", encryptedToken: null };

const providerFailingWith = (error: unknown): InstallationTokenProvider => ({
  getToken: () => Promise.reject(error),
});

describe("resolveToken", () => {
  it("decrypts a stored static token", async () => {
    const deps = makeDeps("plain-token");
    await expect(resolveToken(source, deps)).resolves.toEqual({ ok: true, token: "plain-token" });
    expect(deps.tryDecryptToken).toHaveBeenCalledWith("encrypted");
  });

  it("fails terminally when the stored token does not decrypt", async () => {
    await expect(resolveToken(source, makeDeps(null))).resolves.toEqual({
      ok: false,
      error: "stored token could not be decrypted, re-enter it",
      retryable: false,
    });
  });

  it("fails terminally when a token integration has no token stored", async () => {
    const deps = makeDeps("unused");
    await expect(resolveToken({ ...source, encryptedToken: null }, deps)).resolves.toMatchObject({
      ok: false,
      retryable: false,
    });
    expect(deps.tryDecryptToken).not.toHaveBeenCalled();
  });

  describe("GitHub App integrations", () => {
    it("returns the installation token and a way to invalidate it", async () => {
      const invalidate = vi.fn<() => void>();
      const getToken = vi
        .fn<InstallationTokenProvider["getToken"]>()
        .mockResolvedValue({ token: "ghs_1", invalidate });
      const resolved = await resolveToken(
        appSource,
        makeDeps(null, () => ({ getToken })),
      );

      expect(resolved).toEqual({ ok: true, token: "ghs_1", invalidate });
      expect(getToken).toHaveBeenCalledWith("acme/web");
    });

    it("fails terminally when the deployment has no App configured", async () => {
      await expect(resolveToken(appSource, makeDeps(null))).resolves.toEqual({
        ok: false,
        error: expect.stringMatching(/OVR_GITHUB_APP_ID and OVR_GITHUB_APP_PRIVATE_KEY/),
        retryable: false,
      });
    });

    it("fails terminally when the App's configuration is invalid", async () => {
      const deps = makeDeps(null, () => {
        throw new GitHubAppConfigError("OVR_GITHUB_APP_PRIVATE_KEY is not a valid PEM private key");
      });
      await expect(resolveToken(appSource, deps)).resolves.toMatchObject({
        ok: false,
        error: expect.stringMatching(/not a valid PEM/),
        retryable: false,
      });
    });

    it.each([
      [new GitHubAppError("the GitHub App is not installed on acme/web", false, 404), false],
      [new GitHubAppError("GitHub responded with 502", true, 502), true],
    ])("passes on whether %s is retryable", async (error, retryable) => {
      const deps = makeDeps(null, () => providerFailingWith(error));
      await expect(resolveToken(appSource, deps)).resolves.toEqual({
        ok: false,
        error: error.message,
        retryable,
      });
    });
  });
});
