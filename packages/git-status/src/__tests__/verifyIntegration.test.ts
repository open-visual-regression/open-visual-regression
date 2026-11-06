import { generateKeyPairSync } from "node:crypto";

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { GitHubAppConfigError, readGitHubAppConfig } from "../githubApp/config";
import { verifyGitHubAppIntegration } from "../verifyIntegration";
import { server } from "./setup";

const INSTALLATION_URL = "https://api.github.com/repos/acme/web/installation";
const integration = { provider: "github" as const, repoIdentifier: "acme/web" };

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
const config = readGitHubAppConfig({
  OVR_GITHUB_APP_ID: "1234",
  OVR_GITHUB_APP_PRIVATE_KEY: privateKey,
});

describe("verifyGitHubAppIntegration", () => {
  it("is ok when the App is installed with permission to write statuses", async () => {
    server.use(
      http.get(INSTALLATION_URL, () =>
        HttpResponse.json({ id: 42, permissions: { statuses: "write", metadata: "read" } }),
      ),
    );

    await expect(verifyGitHubAppIntegration(integration, () => config)).resolves.toEqual({
      ok: true,
      httpStatus: 200,
      error: null,
    });
  });

  it("explains when the App can only read statuses", async () => {
    server.use(
      http.get(INSTALLATION_URL, () =>
        HttpResponse.json({ id: 42, permissions: { statuses: "read", metadata: "read" } }),
      ),
    );

    const result = await verifyGitHubAppIntegration(integration, () => config);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Commit statuses: Read and write/);
  });

  it("explains when the App is not installed on the repo", async () => {
    server.use(http.get(INSTALLATION_URL, () => new HttpResponse(null, { status: 404 })));

    await expect(verifyGitHubAppIntegration(integration, () => config)).resolves.toEqual({
      ok: false,
      httpStatus: 404,
      error: "the GitHub App is not installed on acme/web",
    });
  });

  it("explains when no App is configured", async () => {
    const result = await verifyGitHubAppIntegration(integration, () => null);
    expect(result).toMatchObject({ ok: false, httpStatus: null });
    expect(result.error).toMatch(/OVR_GITHUB_APP_ID/);
  });

  it("explains when the App is misconfigured", async () => {
    const result = await verifyGitHubAppIntegration(integration, () => {
      throw new GitHubAppConfigError(
        "OVR_GITHUB_APP_ID is set but OVR_GITHUB_APP_PRIVATE_KEY is not",
      );
    });
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/is set but/) });
  });
});
