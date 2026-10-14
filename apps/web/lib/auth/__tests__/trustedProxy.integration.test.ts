import { convertSetCookieToCookie } from "better-auth/test";
import { headers } from "next/headers";
import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { test, describe, expect, type IdentityProvider } from "@/lib/testing/fixtures";

import { auth } from "../auth";
import { getAuthConfig } from "../config";
import { getCachedSession } from "../session";

vi.mock("next/headers");
vi.mock("@/lib/auth/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/config")>()),
  getAuthConfig: vi.fn(),
  usesTrustedProxy: () => true,
}));

const TOKEN_HEADER = "x-forwarded-id-token";

const signIn = async (identityProvider: IdentityProvider, claims: Record<string, unknown> = {}) => {
  vi.mocked(getAuthConfig).mockReturnValue({
    mode: "trusted-proxy",
    tokenHeader: TOKEN_HEADER,
    issuer: identityProvider.issuer,
    jwksUrl: identityProvider.jwksUrl,
    algorithms: ["ES256"],
    emailClaim: "email",
    nameClaim: "name",
    groupsClaim: "groups",
    roleGroups: { admin: ["ovr-admins"], reviewer: ["ovr-reviewers"] },
  });

  return auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/trusted-proxy?callbackURL=/projects/1", {
      headers: { [TOKEN_HEADER]: await identityProvider.signToken(claims) },
    }),
  );
};

describe("trustedProxy", () => {
  describe("trustedProxy sign-in", () => {
    test("should create a user for a new identity and sign them in", async ({
      identityProvider,
      organization,
    }) => {
      const response = await signIn(identityProvider, { groups: ["ovr-reviewers"] });

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("/projects/1");
      expect(response.headers.get("set-cookie")).toContain("better-auth.session_token=");

      const user = await dbClient.users.findByEmail("jane@example.com");
      expect(user).toMatchObject({ name: "Jane Doe", role: "reviewer" });
      expect(
        await dbClient.organizations.findMembership({
          userId: user!.id,
          organizationId: organization.id,
        }),
      ).toBeDefined();
    });

    test("should sign a returning identity in as the same user", async ({
      identityProvider,
      organization: _,
    }) => {
      await signIn(identityProvider, { groups: ["ovr-reviewers"] });
      const first = await dbClient.users.findByEmail("jane@example.com");

      const response = await signIn(identityProvider, { groups: ["ovr-reviewers"] });

      expect(response.status).toBe(302);
      expect(await dbClient.users.getUserCount()).toBe(2);
      expect((await dbClient.users.findByEmail("jane@example.com"))?.id).toBe(first?.id);
    });

    test("should update the role when the groups change", async ({
      identityProvider,
      organization: _,
    }) => {
      await signIn(identityProvider, { groups: ["ovr-reviewers"] });

      await signIn(identityProvider, { groups: ["ovr-admins"] });

      expect(await dbClient.users.findByEmail("jane@example.com")).toMatchObject({ role: "admin" });
    });

    test("should sign an identity in as the existing user with the same email", async ({
      identityProvider,
      organization: _,
    }) => {
      const { user: existing } = await auth.api.createUser({
        body: { name: "Jane", email: "jane@example.com", password: "securepass123" },
      });

      const response = await signIn(identityProvider, { groups: ["ovr-admins"] });

      expect(response.status).toBe(302);
      expect(await dbClient.users.getUserCount()).toBe(2);
      expect(await dbClient.users.findById(existing.id)).toMatchObject({
        name: "Jane",
        role: "admin",
      });
    });

    test("should refuse an identity with no role without creating anything", async ({
      identityProvider,
      organization: _,
    }) => {
      const response = await signIn(identityProvider, { groups: ["marketing"] });

      expect(response.headers.get("location")).toBe("/forbidden");
      expect(await dbClient.users.findByEmail("jane@example.com")).toBeUndefined();
    });

    test("should refuse a token that fails verification", async ({
      identityProvider,
      organization: _,
    }) => {
      const response = await signIn(identityProvider, {
        iss: "https://attacker.example.com",
        groups: ["ovr-admins"],
      });

      expect(response.headers.get("location")).toBe("/forbidden");
      expect(await dbClient.users.findByEmail("jane@example.com")).toBeUndefined();
    });

    test("should not be served outside trusted-proxy mode", async () => {
      vi.mocked(getAuthConfig).mockReturnValue({ mode: "local" });

      const response = await auth.handler(
        new Request("http://localhost:3000/api/auth/sign-in/trusted-proxy"),
      );

      expect(response.status).toBe(404);
    });
  });

  describe("getCachedSession with a trusted proxy", () => {
    const forward = async (
      identityProvider: IdentityProvider,
      cookie: Headers,
      claims: Record<string, unknown> = {},
    ) => {
      const requestHeaders = new Headers(cookie);
      requestHeaders.set(TOKEN_HEADER, await identityProvider.signToken(claims));
      vi.mocked(headers).mockResolvedValue(requestHeaders);
    };

    const signInAsJane = async (identityProvider: IdentityProvider) =>
      convertSetCookieToCookie(
        (await signIn(identityProvider, { groups: ["ovr-reviewers"] })).headers,
      );

    test("should return the session when the proxy identity matches", async ({
      identityProvider,
      organization: _,
    }) => {
      await forward(identityProvider, await signInAsJane(identityProvider), {
        groups: ["ovr-reviewers"],
      });

      expect((await getCachedSession())?.user).toMatchObject({
        email: "jane@example.com",
        role: "reviewer",
      });
    });

    test("should keep the session when the request carries no proxy identity", async ({
      identityProvider,
      organization: _,
    }) => {
      vi.mocked(headers).mockResolvedValue(await signInAsJane(identityProvider));

      expect((await getCachedSession())?.user.email).toBe("jane@example.com");
    });

    test("should drop the session when the proxy identity is someone else", async ({
      identityProvider,
      organization: _,
    }) => {
      await forward(identityProvider, await signInAsJane(identityProvider), {
        sub: "sam",
        email: "sam@example.com",
        groups: ["ovr-reviewers"],
      });

      expect(await getCachedSession()).toBeNull();
    });

    test("should apply a role change from the groups claim", async ({
      identityProvider,
      organization: _,
    }) => {
      await forward(identityProvider, await signInAsJane(identityProvider), {
        groups: ["ovr-admins"],
      });

      expect((await getCachedSession())?.user.role).toBe("admin");
      expect(await dbClient.users.findByEmail("jane@example.com")).toMatchObject({ role: "admin" });
    });

    test("should revoke every session when the identity loses access", async ({
      identityProvider,
      organization: _,
    }) => {
      const cookie = await signInAsJane(identityProvider);
      await forward(identityProvider, cookie, { groups: [] });

      expect(await getCachedSession()).toBeNull();

      vi.mocked(headers).mockResolvedValue(cookie);
      expect(await getCachedSession()).toBeNull();
    });
  });
});
