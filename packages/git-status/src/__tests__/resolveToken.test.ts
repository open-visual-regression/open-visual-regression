import { describe, expect, it, vi } from "vitest";

import { resolveToken, type ResolveTokenDeps, type TokenSource } from "../resolveToken";

const source: TokenSource = {
  provider: "github",
  repoIdentifier: "acme/web",
  authType: "token",
  encryptedToken: "encrypted",
};

const makeDeps = (decrypted: string | null): ResolveTokenDeps => ({
  tryDecryptToken: vi.fn<ResolveTokenDeps["tryDecryptToken"]>().mockReturnValue(decrypted),
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

  it("does not yet resolve GitHub App integrations", async () => {
    await expect(
      resolveToken({ ...source, authType: "github_app", encryptedToken: null }, makeDeps(null)),
    ).resolves.toMatchObject({ ok: false, retryable: false });
  });
});
