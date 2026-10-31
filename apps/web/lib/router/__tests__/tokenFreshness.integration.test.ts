import { headers } from "next/headers";
import { vi } from "vitest";

import { db, sql } from "@ovr/db/db";

import { auth } from "@/lib/auth/auth";
import { getAuthConfig, type AuthConfig } from "@/lib/auth/config";
import { TRUSTED_PROXY_PROVIDER_ID, toTrustedProxyAccountId } from "@/lib/auth/trustedProxy";
import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");
vi.mock("@/lib/auth/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/config")>()),
  getAuthConfig: vi.fn(),
}));

const ISSUER = "https://example.okta.com";

const TRUSTED_PROXY_CONFIG: AuthConfig = {
  mode: "trusted-proxy",
  tokenHeader: "x-forwarded-id-token",
  issuer: ISSUER,
  jwksUrl: `${ISSUER}/keys`,
  algorithms: ["RS256"],
  emailClaim: "email",
  nameClaim: "name",
  groupsClaim: "groups",
  roleGroups: { reviewer: ["ovr-reviewers"] },
  organizationName: "OVR",
};

const createToken = async () => {
  vi.mocked(getAuthConfig).mockReturnValue({ mode: "local" });
  const [, created] = await serverClient.accessTokens.create({ name: "cursor" });
  vi.mocked(headers).mockResolvedValue(new Headers({ authorization: `Bearer ${created!.token}` }));
  vi.mocked(getAuthConfig).mockReturnValue(TRUSTED_PROXY_CONFIG);
};

const linkIdentity = async (userId: string) => {
  const { internalAdapter } = await auth.$context;
  await internalAdapter.linkAccount({
    providerId: TRUSTED_PROXY_PROVIDER_ID,
    accountId: toTrustedProxyAccountId({ issuer: ISSUER, subject: "00u1" }),
    userId,
  });
};

describe("personal access tokens with a trusted proxy", () => {
  test("should accept a token whose owner has an SSO session", async ({ reviewer }) => {
    await linkIdentity(reviewer.id);
    await createToken();

    const [error] = await serverClient.builds.list();

    expect(error).toBeNull();
  });

  test("should reject a token whose owner never signed in through SSO", async ({ reviewer: _ }) => {
    await createToken();

    const [error] = await serverClient.builds.list();

    expect(error?.code).toBe("UNAUTHORIZED");
  });

  test("should reject a token whose owner's sessions have expired", async ({ reviewer }) => {
    await linkIdentity(reviewer.id);
    await createToken();
    await db.execute(sql`UPDATE session SET expires_at = now() - interval '1 day'`);

    const [error] = await serverClient.builds.list();

    expect(error?.code).toBe("UNAUTHORIZED");
  });

  test("should accept a token without an SSO identity in local mode", async ({ reviewer: _ }) => {
    await createToken();
    vi.mocked(getAuthConfig).mockReturnValue({ mode: "local" });

    const [error] = await serverClient.builds.list();

    expect(error).toBeNull();
  });
});
