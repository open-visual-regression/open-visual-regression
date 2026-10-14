import { afterEach, beforeEach, vi } from "vitest";

import { describe, expect, it } from "@/test-utils";

import { assertAuthConfig, getAuthConfig, InvalidAuthConfigError } from "../config";

const stubTrustedProxyEnv = () => {
  vi.stubEnv("OVR_AUTH_MODE", "trusted-proxy");
  vi.stubEnv("OVR_AUTH_PROXY_TOKEN_HEADER", "x-forwarded-id-token");
  vi.stubEnv("OVR_AUTH_PROXY_ISSUER", "https://example.okta.com");
  vi.stubEnv("OVR_AUTH_PROXY_JWKS_URL", "https://example.okta.com/oauth2/v1/keys");
  vi.stubEnv("OVR_AUTH_ROLE_GROUPS", JSON.stringify({ admin: ["ovr-admins"] }));
};

describe("config", () => {
  describe("getAuthConfig", () => {
    beforeEach(() => {
      vi.stubEnv("OVR_AUTH_MODE", "");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("should default to local mode", () => {
      expect(getAuthConfig()).toEqual({ mode: "local" });
    });

    it("should ignore proxy settings in local mode", () => {
      vi.stubEnv("OVR_AUTH_PROXY_ISSUER", "not a url");

      expect(getAuthConfig()).toEqual({ mode: "local" });
    });

    it("should read a trusted proxy config with defaults", () => {
      stubTrustedProxyEnv();

      expect(getAuthConfig()).toEqual({
        mode: "trusted-proxy",
        tokenHeader: "x-forwarded-id-token",
        issuer: "https://example.okta.com",
        algorithms: ["RS256", "ES256"],
        jwksUrl: "https://example.okta.com/oauth2/v1/keys",
        emailClaim: "email",
        nameClaim: "name",
        groupsClaim: "groups",
        roleGroups: { admin: ["ovr-admins"] },
      });
    });

    it("should read a key URL template and an expected signer", () => {
      stubTrustedProxyEnv();
      vi.stubEnv("OVR_AUTH_PROXY_JWKS_URL", "");
      vi.stubEnv(
        "OVR_AUTH_PROXY_KEY_URL",
        "https://public-keys.auth.elb.us-east-1.amazonaws.com/{kid}",
      );
      vi.stubEnv(
        "OVR_AUTH_PROXY_SIGNER",
        "arn:aws:elasticloadbalancing:us-east-1:1:loadbalancer/app/ovr/1",
      );
      vi.stubEnv("OVR_AUTH_PROXY_ALGORITHMS", "ES256");

      expect(getAuthConfig()).toMatchObject({
        keyUrl: "https://public-keys.auth.elb.us-east-1.amazonaws.com/{kid}",
        signer: "arn:aws:elasticloadbalancing:us-east-1:1:loadbalancer/app/ovr/1",
        algorithms: ["ES256"],
      });
    });

    it.each([
      ["OVR_AUTH_PROXY_TOKEN_HEADER", "", "OVR_AUTH_PROXY_TOKEN_HEADER is required"],
      ["OVR_AUTH_PROXY_ISSUER", "okta", "OVR_AUTH_PROXY_ISSUER must be a URL"],
      ["OVR_AUTH_ROLE_GROUPS", "", "OVR_AUTH_ROLE_GROUPS is required"],
      ["OVR_AUTH_ROLE_GROUPS", "{", "OVR_AUTH_ROLE_GROUPS must be valid JSON"],
      ["OVR_AUTH_ROLE_GROUPS", '{"owner":["a"]}', "OVR_AUTH_ROLE_GROUPS must map"],
      ["OVR_AUTH_PROXY_ALGORITHMS", "HS256", "OVR_AUTH_PROXY_ALGORITHMS must only list"],
      ["OVR_AUTH_PROXY_KEY_URL", "https://keys.example.com", "must contain {kid}"],
      [
        "OVR_AUTH_PROXY_JWKS_URL",
        "",
        "OVR_AUTH_PROXY_JWKS_URL or OVR_AUTH_PROXY_KEY_URL is required, but not both",
      ],
    ])("should reject %s=%j", (name, value, message) => {
      stubTrustedProxyEnv();
      vi.stubEnv(name, value);

      expect(() => getAuthConfig()).toThrow(message);
    });

    it("should reject both a JWKS URL and a key URL", () => {
      stubTrustedProxyEnv();
      vi.stubEnv("OVR_AUTH_PROXY_KEY_URL", "https://keys.example.com/{kid}");

      expect(() => getAuthConfig()).toThrow("but not both");
    });
  });

  describe("assertAuthConfig", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("should throw when the config is invalid", () => {
      vi.stubEnv("OVR_AUTH_MODE", "sso");

      expect(() => assertAuthConfig()).toThrow(InvalidAuthConfigError);
    });

    it("should reject trusted-proxy mode until it is supported", () => {
      stubTrustedProxyEnv();

      expect(() => assertAuthConfig()).toThrow("OVR_AUTH_MODE trusted-proxy is not supported yet");
    });
  });
});
