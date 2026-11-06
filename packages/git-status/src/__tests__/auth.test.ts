import { randomBytes } from "node:crypto";

import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";

import { availableAuthTypes, verifyIntegration } from "../auth";
import { encryptToken } from "../crypto";
import { readGitHubAppConfig } from "../githubApp/config";
import { generateAppPrivateKey, useFakeGitHub } from "./fakeGitHub";
import { server } from "./setup";

const ENCRYPTION_KEY = randomBytes(32).toString("base64");

it("verifies a token integration with the decrypted token that it can push to the repo", async () => {
  vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", ENCRYPTION_KEY);
  const authorization = vi.fn<(header: string | null) => void>();
  server.use(
    http.get("https://api.github.com/repos/acme/web", ({ request }) => {
      authorization(request.headers.get("authorization"));
      return HttpResponse.json({ permissions: { push: true } });
    }),
  );

  const result = await verifyIntegration({
    provider: "github",
    repoIdentifier: "acme/web",
    authType: "token",
    encryptedToken: encryptToken("ghp_secret"),
  });

  expect(result).toEqual({ ok: true, httpStatus: 200, error: null });
  expect(authorization).toHaveBeenCalledWith("Bearer ghp_secret");
});

it("explains when the stored token can't be decrypted", async () => {
  vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", ENCRYPTION_KEY);

  const result = await verifyIntegration({
    provider: "github",
    repoIdentifier: "acme/web",
    authType: "token",
    encryptedToken: "not-a-ciphertext",
  });

  expect(result).toEqual({
    ok: false,
    httpStatus: null,
    error: "stored token could not be decrypted, re-enter it",
  });
});

const APP_PRIVATE_KEY = generateAppPrivateKey();

const configureApp = () => {
  vi.stubEnv("OVR_GITHUB_APP_ID", "1234");
  vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", APP_PRIVATE_KEY);
  return readGitHubAppConfig()!;
};

const appIntegration = {
  provider: "github" as const,
  repoIdentifier: "acme/web",
  authType: "github_app" as const,
  encryptedToken: null,
};

it("verifies an App integration installed with permission to write statuses", async () => {
  useFakeGitHub({ app: configureApp() });

  await expect(verifyIntegration(appIntegration)).resolves.toEqual({
    ok: true,
    httpStatus: 200,
    error: null,
  });
});

it("explains when the App can only read statuses", async () => {
  useFakeGitHub({ app: configureApp(), permissions: { statuses: "read", metadata: "read" } });

  const result = await verifyIntegration(appIntegration);

  expect(result.ok).toBe(false);
  expect(result.error).toMatch(/"Commit statuses: Read and write"/);
});

it("explains when the App is not installed on the repo", async () => {
  useFakeGitHub({ app: configureApp(), owner: "someone-else" });

  await expect(verifyIntegration(appIntegration)).resolves.toEqual({
    ok: false,
    httpStatus: 404,
    error: "the GitHub App is not installed on acme/web",
  });
});

it("explains when the deployment has no App", async () => {
  const result = await verifyIntegration(appIntegration);

  expect(result).toMatchObject({ ok: false, httpStatus: null });
  expect(result.error).toMatch(/set OVR_GITHUB_APP_ID and OVR_GITHUB_APP_PRIVATE_KEY/);
});

it("explains when the deployment's App is half configured", async () => {
  vi.stubEnv("OVR_GITHUB_APP_ID", "1234");

  const result = await verifyIntegration(appIntegration);

  expect(result.error).toMatch(/OVR_GITHUB_APP_ID is set but OVR_GITHUB_APP_PRIVATE_KEY is not/);
});

it("offers only token auth when the deployment has no App", () => {
  expect(availableAuthTypes()).toEqual({ github: ["token"] });
});

it("offers App auth for github once the deployment has an App", () => {
  configureApp();

  expect(availableAuthTypes()).toEqual({ github: ["token", "github_app"] });
});
