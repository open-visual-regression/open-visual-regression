import { base64url, UnsecuredJWT } from "jose";

import { test, describe, expect, type IdentityProvider } from "@/lib/testing/fixtures";

import type { TrustedProxyConfig } from "../config";
import { InvalidProxyTokenError, resolveRole, verifyProxyToken } from "../proxyToken";

const TOKEN_HEADER = "x-forwarded-id-token";

const createConfig = (
  { issuer, jwksUrl }: IdentityProvider,
  overrides: Partial<TrustedProxyConfig> = {},
): TrustedProxyConfig => ({
  tokenHeader: TOKEN_HEADER,
  issuer,
  algorithms: ["RS256", "ES256"],
  jwksUrl,
  emailClaim: "email",
  nameClaim: "name",
  groupsClaim: "groups",
  roleGroups: {},
  ...overrides,
});

const withToken = (token: string) => new Headers({ [TOKEN_HEADER]: token });

describe("proxyToken", () => {
  describe("verifyProxyToken", () => {
    test("should return the identity from a valid token", async ({ identityProvider }) => {
      const token = await identityProvider.signToken({ groups: ["ovr-reviewers"] });

      expect(await verifyProxyToken(withToken(token), createConfig(identityProvider))).toEqual([
        null,
        {
          issuer: identityProvider.issuer,
          subject: "jane",
          email: "jane@example.com",
          name: "Jane Doe",
          groups: ["ovr-reviewers"],
        },
      ]);
    });

    test("should return no identity when the header is missing", async ({ identityProvider }) => {
      expect(await verifyProxyToken(new Headers(), createConfig(identityProvider))).toEqual([
        null,
        null,
      ]);
    });

    test("should read a bearer token", async ({ identityProvider }) => {
      const token = await identityProvider.signToken();
      const config = createConfig(identityProvider, { tokenHeader: "authorization" });

      const [, identity] = await verifyProxyToken(
        new Headers({ authorization: `Bearer ${token}` }),
        config,
      );

      expect(identity?.subject).toBe("jane");
    });

    test("should return no identity for an OVR token in the same header", async ({
      identityProvider,
    }) => {
      const config = createConfig(identityProvider, { tokenHeader: "authorization" });

      expect(
        await verifyProxyToken(new Headers({ authorization: "Bearer ovr_pat_abc123" }), config),
      ).toEqual([null, null]);
    });

    test("should verify a token against a key URL", async ({ identityProvider }) => {
      const token = await identityProvider.signToken();
      const config = createConfig(identityProvider, {
        jwksUrl: undefined,
        keyUrl: identityProvider.keyUrl,
      });

      const [, identity] = await verifyProxyToken(withToken(token), config);

      expect(identity?.subject).toBe("jane");
    });

    test("should accept a token from the expected signer", async ({ identityProvider }) => {
      const token = await identityProvider.signToken({}, { header: { signer: "arn:alb" } });
      const config = createConfig(identityProvider, { signer: "arn:alb" });

      const [, identity] = await verifyProxyToken(withToken(token), config);

      expect(identity?.subject).toBe("jane");
    });

    test("should use the configured claims", async ({ identityProvider }) => {
      const token = await identityProvider.signToken({
        preferred_username: "jane.doe@example.com",
        display_name: "Jane",
        roles: "ovr-admins",
      });
      const config = createConfig(identityProvider, {
        emailClaim: "preferred_username",
        nameClaim: "display_name",
        groupsClaim: "roles",
      });

      const [, identity] = await verifyProxyToken(withToken(token), config);

      expect(identity).toMatchObject({
        email: "jane.doe@example.com",
        name: "Jane",
        groups: ["ovr-admins"],
      });
    });

    test("should normalize the email and fall back to it for the name", async ({
      identityProvider,
    }) => {
      const token = await identityProvider.signToken({
        email: "Jane@Example.com",
        name: undefined,
      });

      const [, identity] = await verifyProxyToken(withToken(token), createConfig(identityProvider));

      expect(identity).toMatchObject({ email: "jane@example.com", name: "Jane@Example.com" });
    });

    test.for([
      ["is missing", undefined],
      ["is malformed", { admin: true }],
    ] as const)(
      "should return no groups when the groups claim %s",
      async ([, groups], { identityProvider }) => {
        const token = await identityProvider.signToken({ groups });

        const [, identity] = await verifyProxyToken(
          withToken(token),
          createConfig(identityProvider),
        );

        expect(identity?.groups).toEqual([]);
      },
    );

    test.for<[string, Record<string, unknown>, Partial<TrustedProxyConfig>]>([
      ["is not yet valid", { nbf: Math.floor(Date.now() / 1000) + 600 }, {}],
      ["has the wrong issuer", { iss: "https://attacker.example.com" }, {}],
      ["has the wrong audience", { aud: "other-app" }, { audience: "ovr" }],
      ["has no audience when one is expected", {}, { audience: "ovr" }],
      ["has no email", { email: undefined }, {}],
      ["has no subject", { sub: undefined }, {}],
      ["uses a disallowed algorithm", {}, { algorithms: ["RS256"] }],
      ["comes from an unexpected signer", {}, { signer: "arn:alb" }],
    ])("should reject a token that %s", async ([, claims, overrides], { identityProvider }) => {
      const token = await identityProvider.signToken(claims);

      const [error, identity] = await verifyProxyToken(
        withToken(token),
        createConfig(identityProvider, overrides),
      );

      expect(error).toBeInstanceOf(InvalidProxyTokenError);
      expect(identity).toBeNull();
    });

    test("should reject an expired token", async ({ identityProvider }) => {
      const token = await identityProvider.signToken({}, { expiresIn: "1 minute ago" });

      const [error] = await verifyProxyToken(withToken(token), createConfig(identityProvider));

      expect(error).toBeInstanceOf(InvalidProxyTokenError);
    });

    test("should reject a tampered token", async ({ identityProvider }) => {
      const [header, , signature] = (await identityProvider.signToken()).split(".");
      const payload = base64url.encode(
        JSON.stringify({ iss: identityProvider.issuer, sub: "admin" }),
      );

      const [error] = await verifyProxyToken(
        withToken(`${header}.${payload}.${signature}`),
        createConfig(identityProvider),
      );

      expect(error).toBeInstanceOf(InvalidProxyTokenError);
    });

    test("should reject an unsigned token", async ({ identityProvider }) => {
      const token = new UnsecuredJWT({ email: "jane@example.com" })
        .setIssuer(identityProvider.issuer)
        .setSubject("jane")
        .setExpirationTime("5m")
        .encode();

      const [error] = await verifyProxyToken(withToken(token), createConfig(identityProvider));

      expect(error).toBeInstanceOf(InvalidProxyTokenError);
    });

    test("should reject a token signed with an unknown key", async ({ identityProvider }) => {
      const token = await identityProvider.signToken({}, { header: { kid: "unknown" } });
      const config = createConfig(identityProvider, {
        jwksUrl: undefined,
        keyUrl: identityProvider.keyUrl,
      });

      const [error] = await verifyProxyToken(withToken(token), config);

      expect(error).toBeInstanceOf(InvalidProxyTokenError);
    });
  });

  describe("resolveRole", () => {
    const roleGroups = {
      admin: ["ovr-admins"],
      reviewer: ["ovr-reviewers"],
      viewer: ["ovr-viewers", "engineering"],
    };

    test.each([
      [["ovr-admins"], "admin"],
      [["engineering"], "viewer"],
      [["ovr-viewers", "ovr-reviewers"], "reviewer"],
      [["ovr-viewers", "ovr-admins", "ovr-reviewers"], "admin"],
      [["marketing"], null],
      [[], null],
    ])("should resolve %j to %s", (groups, role) => {
      expect(resolveRole(groups, roleGroups)).toBe(role);
    });

    test("should resolve no role when no groups are mapped", () => {
      expect(resolveRole(["ovr-admins"], {})).toBeNull();
    });
  });
});
