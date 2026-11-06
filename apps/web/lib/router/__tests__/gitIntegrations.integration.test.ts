import { generateKeyPairSync } from "node:crypto";

import { vi } from "vitest";

import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";

import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const FAKE_PROJECT_ID = "01900000-0000-7000-8000-000000000000";

const { privateKey: APP_PRIVATE_KEY } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const configureGitHubApp = () => {
  vi.stubEnv("OVR_GITHUB_APP_ID", "1234");
  vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", APP_PRIVATE_KEY);
};

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

describe("gitIntegrations", () => {
  describe("get", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.gitIntegrations.get({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.gitIntegrations.get({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return NOT_FOUND when the project does not exist", async ({ admin: _ }) => {
      const [error] = await serverClient.gitIntegrations.get({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("NOT_FOUND");
    });

    test("should return null when no integration is configured", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await serverClient.gitIntegrations.get({ projectId });
      expect(error).toBeNull();
      expect(result?.integration).toBeNull();
    });

    test("should report whether the deployment has a GitHub App", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [, withoutApp] = await serverClient.gitIntegrations.get({ projectId });
      expect(withoutApp?.githubAppConfigured).toBe(false);

      configureGitHubApp();
      const [, withApp] = await serverClient.gitIntegrations.get({ projectId });
      expect(withApp?.githubAppConfigured).toBe(true);
    });
  });

  describe("upsert", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.gitIntegrations.upsert({
        projectId: FAKE_PROJECT_ID,
        provider: "github",
        repoIdentifier: "acme/web",
        token: "a-token",
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.gitIntegrations.upsert({
        projectId: FAKE_PROJECT_ID,
        provider: "github",
        repoIdentifier: "acme/web",
        token: "a-token",
      });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should store an encrypted token that get never exposes", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        token: "a-secret-token",
      });
      expect(error).toBeNull();
      expect(result).toMatchObject({ provider: "github", repoIdentifier: "acme/web" });
      expect(result).not.toHaveProperty("token");
      expect(result).not.toHaveProperty("encryptedToken");

      const [, getResult] = await serverClient.gitIntegrations.get({ projectId });
      expect(getResult?.integration).toMatchObject({ hasToken: true, repoIdentifier: "acme/web" });
    });

    test("should derive the check context from the project name", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [, result] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        token: "a-secret-token",
      });
      expect(result).toMatchObject({ checkContext: "Open Visual Regression / Test Project" });
    });

    test("should give distinct projects distinct check contexts", async ({ admin: _ }) => {
      const [, firstProject] = await serverClient.projects.add(TEST_PROJECT);
      const [, secondProject] = await serverClient.projects.add({
        ...TEST_PROJECT,
        projectName: "Other Project",
      });

      const [, firstResult] = await serverClient.gitIntegrations.upsert({
        projectId: firstProject!.projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        token: "a-secret-token",
      });
      const [, secondResult] = await serverClient.gitIntegrations.upsert({
        projectId: secondProject!.projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        token: "a-secret-token",
      });

      expect(firstResult?.checkContext).not.toBe(secondResult?.checkContext);
    });

    test("should update fields without re-sending the token", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        token: "a-secret-token",
      });

      const [error, result] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/renamed",
      });
      expect(error).toBeNull();
      expect(result).toMatchObject({ repoIdentifier: "acme/renamed", hasToken: true });
    });

    test("should reject a first-time save without a token", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
      });
      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should replace an existing integration for the project", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        token: "first-token",
      });
      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/other",
        token: "second-token",
      });

      const [, result] = await serverClient.gitIntegrations.get({ projectId });
      expect(result?.integration).toMatchObject({
        provider: "github",
        repoIdentifier: "acme/other",
      });
    });
  });

  describe("upsert with GitHub App auth", () => {
    test("should save without a token when the deployment has an App", async ({ admin: _ }) => {
      configureGitHubApp();
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        authType: "github_app",
      });
      expect(error).toBeNull();
      expect(result).toMatchObject({ authType: "github_app", hasToken: false });

      const [, getResult] = await serverClient.gitIntegrations.get({ projectId });
      expect(getResult?.integration).toMatchObject({ authType: "github_app", hasToken: false });
    });

    test("should reject App auth when the deployment has no App", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);

      const [error] = await serverClient.gitIntegrations.upsert({
        projectId: addResult!.projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        authType: "github_app",
      });
      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should drop the stored token when switching to App auth", async ({ admin: _ }) => {
      configureGitHubApp();
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        token: "a-secret-token",
      });
      const [, result] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        authType: "github_app",
      });
      expect(result).toMatchObject({ authType: "github_app", hasToken: false });
    });

    test("should require a token when switching back to token auth", async ({ admin: _ }) => {
      configureGitHubApp();
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        authType: "github_app",
      });

      const [error] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        authType: "token",
      });
      expect(error?.code).toBe("BAD_REQUEST");

      const [, result] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        authType: "token",
        token: "a-secret-token",
      });
      expect(result).toMatchObject({ authType: "token", hasToken: true });
    });
  });

  describe("setStatusChecks", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.gitIntegrations.setStatusChecks({
        projectId: FAKE_PROJECT_ID,
        enabled: false,
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.gitIntegrations.setStatusChecks({
        projectId: FAKE_PROJECT_ID,
        enabled: false,
      });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return BAD_REQUEST when no integration is configured", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);

      const [error] = await serverClient.gitIntegrations.setStatusChecks({
        projectId: addResult!.projectId,
        enabled: false,
      });
      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should toggle status checks for the project", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        token: "a-token",
      });

      const [error, disabled] = await serverClient.gitIntegrations.setStatusChecks({
        projectId,
        enabled: false,
      });
      expect(error).toBeNull();
      expect(disabled?.statusChecksEnabled).toBe(false);

      const [, result] = await serverClient.gitIntegrations.get({ projectId });
      expect(result?.integration).toMatchObject({
        repoIdentifier: "acme/web",
        statusChecksEnabled: false,
      });
    });
  });

  describe("remove", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.gitIntegrations.remove({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.gitIntegrations.remove({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should delete the integration for the project", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        token: "a-token",
      });

      const [error] = await serverClient.gitIntegrations.remove({ projectId });
      expect(error).toBeNull();

      const [, result] = await serverClient.gitIntegrations.get({ projectId });
      expect(result?.integration).toBeNull();
    });
  });

  describe("testConnection", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.gitIntegrations.testConnection({
        projectId: FAKE_PROJECT_ID,
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.gitIntegrations.testConnection({
        projectId: FAKE_PROJECT_ID,
      });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return BAD_REQUEST when no integration is configured", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error] = await serverClient.gitIntegrations.testConnection({ projectId });
      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should explain when an App integration's deployment has no App", async ({ admin: _ }) => {
      configureGitHubApp();
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;
      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        repoIdentifier: "acme/web",
        authType: "github_app",
      });
      vi.unstubAllEnvs();

      const [error, result] = await serverClient.gitIntegrations.testConnection({ projectId });
      expect(error).toBeNull();
      expect(result).toMatchObject({ ok: false, httpStatus: null });
      expect(result?.error).toMatch(/OVR_GITHUB_APP_ID/);
    });
  });
});
