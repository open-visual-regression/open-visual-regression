import { generateKeyPairSync } from "node:crypto";

import { GitHubAppConfigError, readGitHubAppConfig } from "../githubApp/config";
import { describe, expect, test } from "./fixtures";

describe("readGitHubAppConfig", () => {
  test("returns null when no App is configured", () => {
    expect(readGitHubAppConfig({})).toBeNull();
  });

  test("accepts a key stored on one line with escaped newlines", ({ githubAppPrivateKey }) => {
    const config = readGitHubAppConfig({
      OVR_GITHUB_APP_ID: "1234",
      OVR_GITHUB_APP_PRIVATE_KEY: githubAppPrivateKey.trim().replace(/\n/g, "\\n"),
    });

    expect(config?.appId).toBe("1234");
    expect(config?.privateKey.asymmetricKeyType).toBe("rsa");
  });

  test.each([
    { OVR_GITHUB_APP_ID: "1234" },
    { OVR_GITHUB_APP_PRIVATE_KEY: "-----BEGIN RSA PRIVATE KEY-----" },
  ])("throws when only one variable is set: %o", (env) => {
    expect(() => readGitHubAppConfig(env)).toThrow(GitHubAppConfigError);
  });

  test("throws on a key that is not a PEM private key", () => {
    expect(() =>
      readGitHubAppConfig({ OVR_GITHUB_APP_ID: "1234", OVR_GITHUB_APP_PRIVATE_KEY: "nope" }),
    ).toThrow(/not a valid PEM private key/);
  });

  test("throws on a key that is not RSA", () => {
    const { privateKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });

    expect(() =>
      readGitHubAppConfig({ OVR_GITHUB_APP_ID: "1234", OVR_GITHUB_APP_PRIVATE_KEY: privateKey }),
    ).toThrow(/RSA/);
  });
});
