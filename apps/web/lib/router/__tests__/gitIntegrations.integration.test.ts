import { vi } from "vitest";

import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";

import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const FAKE_PROJECT_ID = "01900000-0000-7000-8000-000000000000";

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

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
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
        baseUrl: null,
        repoIdentifier: "acme/web",
        token: "a-token",
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await serverClient.gitIntegrations.upsert({
        projectId: FAKE_PROJECT_ID,
        provider: "github",
        baseUrl: null,
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
        baseUrl: null,
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

    test("should replace an existing integration for the project", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        baseUrl: null,
        repoIdentifier: "acme/web",
        token: "first-token",
      });
      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "gitea",
        baseUrl: "https://gitea.acme.com",
        repoIdentifier: "acme/other",
        token: "second-token",
      });

      const [, result] = await serverClient.gitIntegrations.get({ projectId });
      expect(result?.integration).toMatchObject({
        provider: "gitea",
        baseUrl: "https://gitea.acme.com",
        repoIdentifier: "acme/other",
      });
    });
  });

  describe("remove", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.gitIntegrations.remove({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await serverClient.gitIntegrations.remove({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should delete the integration for the project", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.gitIntegrations.upsert({
        projectId,
        provider: "github",
        baseUrl: null,
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

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
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
