import { vi } from "vitest";

import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";

import { serverClient } from "@/lib/router";
import { useFakeGithub } from "@/lib/testing/fakeGithub";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const FAKE_PROJECT_ID = "01900000-0000-7000-8000-000000000000";

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

const github = useFakeGithub();

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
  });

  describe("upsert", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.gitIntegrations.upsert({
        projectId: FAKE_PROJECT_ID,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/web", token: "a-token" },
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.gitIntegrations.upsert({
        projectId: FAKE_PROJECT_ID,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/web", token: "a-token" },
      });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should store an encrypted token that get never exposes", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/web", token: "a-secret-token" },
      });
      expect(error).toBeNull();
      expect(result).toMatchObject({ provider: "github", repoIdentifier: "acme/web" });
      expect(result).not.toHaveProperty("token");
      expect(result).not.toHaveProperty("encryptedToken");

      const [, getResult] = await serverClient.gitIntegrations.get({ projectId });
      expect(getResult?.integration).toMatchObject({
        credentialType: "access_token",
        repoIdentifier: "acme/web",
      });
    });

    test("should derive the check context from the project name", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [, result] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/web", token: "a-secret-token" },
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
        credential: { type: "access_token", repoIdentifier: "acme/web", token: "a-secret-token" },
      });
      const [, secondResult] = await serverClient.gitIntegrations.upsert({
        projectId: secondProject!.projectId,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/web", token: "a-secret-token" },
      });

      expect(firstResult?.checkContext).not.toBe(secondResult?.checkContext);
    });

    test("should update fields without re-sending the token", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/web", token: "a-secret-token" },
      });

      const [error, result] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/renamed" },
      });
      expect(error).toBeNull();
      expect(result).toMatchObject({
        repoIdentifier: "acme/renamed",
        credentialType: "access_token",
      });
    });

    test("should reject a first-time save without a token", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/web" },
      });
      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should replace an existing integration for the project", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/web", token: "first-token" },
      });
      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/other", token: "second-token" },
      });

      const [, result] = await serverClient.gitIntegrations.get({ projectId });
      expect(result?.integration).toMatchObject({
        provider: "github",
        repoIdentifier: "acme/other",
      });
    });
  });

  describe("upsert with a connection", () => {
    test("should link a repository the connection can access", async ({ admin: _ }) => {
      github.configure();
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "connection", connectionId: "42", repositoryId: "7" },
      });

      expect(error).toBeNull();
      expect(result).toMatchObject({
        credentialType: "connection",
        repoIdentifier: "acme/web",
        connectionId: "42",
        externalRepoId: "7",
      });
    });

    test("should switch an access token integration to a connection", async ({ admin: _ }) => {
      github.configure();
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;
      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/web", token: "a-token" },
      });

      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "connection", connectionId: "42", repositoryId: "7" },
      });

      const [, result] = await serverClient.gitIntegrations.get({ projectId });
      expect(result?.integration).toMatchObject({
        credentialType: "connection",
        externalRepoId: "7",
      });
    });

    test("should reject a repository the connection can't access", async ({ admin: _ }) => {
      github.configure();
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);

      const [error] = await serverClient.gitIntegrations.upsert({
        projectId: addResult!.projectId,
        provider: "github",
        credential: { type: "connection", connectionId: "42", repositoryId: "999" },
      });

      expect(error?.code).toBe("BAD_REQUEST");
      expect(error?.message).toBe("the github app installation can't access that repository");
    });

    test("should reject a connection when the provider has none configured", async ({
      admin: _,
    }) => {
      github.unconfigure();
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);

      const [error] = await serverClient.gitIntegrations.upsert({
        projectId: addResult!.projectId,
        provider: "github",
        credential: { type: "connection", connectionId: "42", repositoryId: "7" },
      });

      expect(error?.code).toBe("BAD_REQUEST");
      expect(error?.message).toBe("github app is not configured on this instance");
    });

    test("should require a token to switch a connection integration to an access token", async ({
      admin: _,
    }) => {
      github.configure();
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;
      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "connection", connectionId: "42", repositoryId: "7" },
      });

      const [error] = await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "access_token", repoIdentifier: "acme/web" },
      });

      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should test the connection through the provider", async ({ admin: _ }) => {
      github.configure();
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;
      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        credential: { type: "connection", connectionId: "42", repositoryId: "7" },
      });

      const [error, result] = await serverClient.gitIntegrations.testConnection({ projectId });

      expect(error).toBeNull();
      expect(result).toEqual({ ok: true, httpStatus: 200, error: null });
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
        credential: { type: "access_token", repoIdentifier: "acme/web", token: "a-token" },
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
        credential: { type: "access_token", repoIdentifier: "acme/web", token: "a-token" },
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
  });
});
