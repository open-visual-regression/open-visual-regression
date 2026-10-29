import { generateKeyPairSync } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import {
  assertGithubAppConfig,
  getGithubAppConfig,
  GithubAppConfigError,
} from "../../githubApp/config";
import { TEST_PRIVATE_KEY_PEM } from "./testKeys";

const stubApp = (clientId: string, privateKey: string) => {
  vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", clientId);
  vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", privateKey);
};

describe("getGithubAppConfig", () => {
  it("returns null when no app is configured", () => {
    stubApp("", "");
    expect(getGithubAppConfig()).toBeNull();
  });

  it("reads the client id and a verbatim PEM key", () => {
    stubApp("Iv23liExample", TEST_PRIVATE_KEY_PEM);
    const config = getGithubAppConfig();
    expect(config?.clientId).toBe("Iv23liExample");
    expect(config?.privateKey.asymmetricKeyType).toBe("rsa");
  });

  it("accepts a PEM key with escaped newlines", () => {
    stubApp("Iv23liExample", TEST_PRIVATE_KEY_PEM.replaceAll("\n", "\\n"));
    expect(getGithubAppConfig()?.privateKey.asymmetricKeyType).toBe("rsa");
  });

  it("accepts a base64 encoded PEM key", () => {
    stubApp("Iv23liExample", Buffer.from(TEST_PRIVATE_KEY_PEM).toString("base64"));
    expect(getGithubAppConfig()?.privateKey.asymmetricKeyType).toBe("rsa");
  });

  it("rejects a client id without a private key", () => {
    stubApp("Iv23liExample", "");
    expect(() => getGithubAppConfig()).toThrow(GithubAppConfigError);
    expect(() => getGithubAppConfig()).toThrow(/OVR_GITHUB_APP_PRIVATE_KEY is required/);
  });

  it("rejects a private key without a client id", () => {
    stubApp("", TEST_PRIVATE_KEY_PEM);
    expect(() => getGithubAppConfig()).toThrow(/OVR_GITHUB_APP_CLIENT_ID is required/);
  });

  it("rejects a value that is not a private key", () => {
    stubApp("Iv23liExample", "not-a-key");
    expect(() => getGithubAppConfig()).toThrow(/must be a PEM private key/);
  });

  it("rejects a malformed PEM key", () => {
    stubApp(
      "Iv23liExample",
      "-----BEGIN RSA PRIVATE KEY-----\ngarbage\n-----END RSA PRIVATE KEY-----",
    );
    expect(() => getGithubAppConfig()).toThrow(/could not be read as a private key/);
  });

  it("rejects a key that is not RSA", () => {
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    stubApp("Iv23liExample", privateKey.export({ type: "pkcs8", format: "pem" }).toString());
    expect(() => getGithubAppConfig()).toThrow(/must be an RSA private key/);
  });

  it("picks up a changed environment", () => {
    stubApp("", "");
    expect(getGithubAppConfig()).toBeNull();
    stubApp("Iv23liExample", TEST_PRIVATE_KEY_PEM);
    expect(getGithubAppConfig()?.clientId).toBe("Iv23liExample");
  });
});

describe("assertGithubAppConfig", () => {
  it("passes when no app is configured", () => {
    stubApp("", "");
    expect(() => assertGithubAppConfig()).not.toThrow();
  });

  it("throws when the app is partly configured", () => {
    stubApp("Iv23liExample", "");
    expect(() => assertGithubAppConfig()).toThrow(GithubAppConfigError);
  });
});
