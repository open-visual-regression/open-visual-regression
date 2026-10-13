import { headers } from "next/headers";
import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { test, describe, expect, type IdentityProvider } from "@/lib/testing/fixtures";

import { recordProxyIdentity } from "../shadow";

vi.mock("next/headers");

const TOKEN_HEADER = "x-forwarded-id-token";

const stubShadowMode = ({ issuer, jwksUrl }: IdentityProvider) => {
  vi.stubEnv("OVR_AUTH_MODE", "trusted-proxy-shadow");
  vi.stubEnv("OVR_AUTH_PROXY_TOKEN_HEADER", TOKEN_HEADER);
  vi.stubEnv("OVR_AUTH_PROXY_ISSUER", issuer);
  vi.stubEnv("OVR_AUTH_PROXY_JWKS_URL", jwksUrl);
  vi.stubEnv(
    "OVR_AUTH_ROLE_GROUPS",
    JSON.stringify({ admin: ["ovr-admins"], reviewer: ["ovr-reviewers"] }),
  );
};

const forwardToken = (token: string) => {
  vi.mocked(headers).mockResolvedValue(new Headers({ [TOKEN_HEADER]: token }));
};

describe("recordProxyIdentity", () => {
  test("should record the forwarded identity and the role it would get", async ({
    identityProvider,
  }) => {
    stubShadowMode(identityProvider);
    forwardToken(await identityProvider.signToken({ groups: ["ovr-reviewers"] }));

    await recordProxyIdentity();

    expect(
      await dbClient.ssoIdentities.find({ issuer: identityProvider.issuer, subject: "jane" }),
    ).toMatchObject({
      email: "jane@example.com",
      name: "Jane Doe",
      role: "reviewer",
    });
  });

  test("should record an identity that would have no access", async ({ identityProvider }) => {
    stubShadowMode(identityProvider);
    forwardToken(await identityProvider.signToken({ groups: ["marketing"] }));

    await recordProxyIdentity();

    expect(
      await dbClient.ssoIdentities.find({ issuer: identityProvider.issuer, subject: "jane" }),
    ).toMatchObject({ role: null });
  });

  test("should not record an invalid token", async ({ identityProvider }) => {
    stubShadowMode(identityProvider);
    forwardToken(await identityProvider.signToken({ iss: "https://attacker.example.com" }));

    await expect(recordProxyIdentity()).resolves.toBeUndefined();

    expect(
      await dbClient.ssoIdentities.find({ issuer: identityProvider.issuer, subject: "jane" }),
    ).toBeUndefined();
  });

  test("should not record anything in local mode", async ({ identityProvider }) => {
    forwardToken(await identityProvider.signToken());

    await recordProxyIdentity();

    expect(
      await dbClient.ssoIdentities.find({ issuer: identityProvider.issuer, subject: "jane" }),
    ).toBeUndefined();
  });
});
