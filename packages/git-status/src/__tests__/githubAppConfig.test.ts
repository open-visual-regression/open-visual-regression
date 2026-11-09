import { generateKeyPairSync } from "node:crypto";
import { join } from "node:path";

import { GitHubAppConfigError, readGitHubAppConfig } from "../githubApp/config";
import { describe, expect, test } from "./fixtures";

describe("readGitHubAppConfig", () => {
  test("returns null when no App is configured", () => {
    expect(readGitHubAppConfig({})).toBeNull();
  });

  test("reads the key from the file", ({ githubAppPrivateKey, writeTempFile }) => {
    const config = readGitHubAppConfig({
      OVR_GITHUB_APP_ID: "1234",
      OVR_GITHUB_APP_PRIVATE_KEY_FILE: writeTempFile(githubAppPrivateKey),
    });

    expect(config?.appId).toBe("1234");
    expect(config?.privateKey.asymmetricKeyType).toBe("rsa");
  });

  test.each([
    { OVR_GITHUB_APP_ID: "1234" },
    { OVR_GITHUB_APP_PRIVATE_KEY_FILE: "/run/secrets/github-app.pem" },
  ])("throws when only one variable is set: %o", (env) => {
    expect(() => readGitHubAppConfig(env)).toThrow(GitHubAppConfigError);
  });

  test("throws when the file can't be read", ({ writeTempFile }) => {
    const missing = join(writeTempFile(""), "..", "missing.pem");

    expect(() =>
      readGitHubAppConfig({ OVR_GITHUB_APP_ID: "1234", OVR_GITHUB_APP_PRIVATE_KEY_FILE: missing }),
    ).toThrow(
      `OVR_GITHUB_APP_PRIVATE_KEY_FILE points to ${missing}, which could not be read (ENOENT)`,
    );
  });

  test("throws without echoing a file that is not a PEM private key", ({ writeTempFile }) => {
    const path = writeTempFile("not-a-key-but-maybe-a-secret");

    expect(() =>
      readGitHubAppConfig({ OVR_GITHUB_APP_ID: "1234", OVR_GITHUB_APP_PRIVATE_KEY_FILE: path }),
    ).toThrow(`GitHub App is misconfigured: ${path} is not a valid PEM private key`);
  });

  test("throws on a key that is not RSA", ({ writeTempFile }) => {
    const { privateKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });

    expect(() =>
      readGitHubAppConfig({
        OVR_GITHUB_APP_ID: "1234",
        OVR_GITHUB_APP_PRIVATE_KEY_FILE: writeTempFile(privateKey),
      }),
    ).toThrow(/RSA/);
  });
});
