import { vi } from "vitest";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { router } from "@/lib/router";
import type { AddProjectInput } from "@ovr/api/contracts/projects";

vi.mock("next/headers");

const FAKE_PROJECT_ID = "01900000-0000-7000-8000-000000000000";

const TEST_PROJECT: AddProjectInput = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
  diffThreshold: 0.05,
};

describe("apiKeys", () => {
  describe("create", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.apiKeys.create({ projectId: FAKE_PROJECT_ID, name: "my key" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await router.apiKeys.create({ projectId: FAKE_PROJECT_ID, name: "my key" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return the api key when created by an admin", async ({ admin: _ }) => {
      const [, addResult] = await router.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await router.apiKeys.create({ projectId, name: "my key" });
      expect(error).toBeNull();
      expect(result?.key).toMatch(/^ovr_api_key_/);
    });

    test("should store the projectId in metadata, scoping the key to that project", async ({
      admin: _,
    }) => {
      const [, addResult] = await router.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await router.apiKeys.create({ projectId, name: "persist test key" });

      const [, list] = await router.apiKeys.list({ projectId });
      expect(list?.apiKeys).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "persist test key" })]),
      );
    });
  });

  describe("list", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.apiKeys.list({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await router.apiKeys.list({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return an empty list when the project has no keys", async ({ admin: _ }) => {
      const [, addResult] = await router.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await router.apiKeys.list({ projectId });
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(0);
      expect(result?.total).toBe(0);
    });

    test("should return the api keys for the project", async ({ admin: _ }) => {
      const [, addResult] = await router.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await router.apiKeys.create({ projectId, name: "key one" });
      await router.apiKeys.create({ projectId, name: "key two" });

      const [error, result] = await router.apiKeys.list({ projectId });
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(2);
      expect(result?.total).toBe(2);
    });

    test("should respect the limit and offset params", async ({ admin: _ }) => {
      const [, addResult] = await router.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await router.apiKeys.create({ projectId, name: "key one" });
      await router.apiKeys.create({ projectId, name: "key two" });
      await router.apiKeys.create({ projectId, name: "key three" });

      const [error, result] = await router.apiKeys.list({ projectId, limit: 2, offset: 1 });
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(2);
      expect(result?.total).toBe(3);
    });

    test("should only return keys belonging to the given project", async ({ admin: _ }) => {
      const [, projectA] = await router.projects.add(TEST_PROJECT);
      const [, projectB] = await router.projects.add({
        ...TEST_PROJECT,
        projectName: "Project B",
      });

      await router.apiKeys.create({ projectId: projectA!.projectId, name: "key for A" });
      await router.apiKeys.create({ projectId: projectB!.projectId, name: "key for B" });

      const [error, result] = await router.apiKeys.list({ projectId: projectA!.projectId });
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(1);
      expect(result?.apiKeys[0]).toMatchObject({ name: "key for A" });
    });

    test("should include the owner name for each key", async ({ admin }) => {
      const [, addResult] = await router.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await router.apiKeys.create({ projectId, name: "owned key" });

      const [error, result] = await router.apiKeys.list({ projectId });
      expect(error).toBeNull();
      expect(result?.apiKeys[0]).toMatchObject({ name: "owned key", ownerName: admin.name });
    });
  });

  describe("revoke", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.apiKeys.revoke({ keyId: "fake-id" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await router.apiKeys.revoke({ keyId: "fake-id" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should delete the api key from the database when revoked by an admin", async ({
      admin: _,
    }) => {
      const [, addResult] = await router.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await router.apiKeys.create({ projectId, name: "revoke test key" });
      const [, beforeList] = await router.apiKeys.list({ projectId });
      expect(beforeList?.apiKeys).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "revoke test key" })]),
      );

      const [key] = beforeList!.apiKeys;
      const [error] = await router.apiKeys.revoke({ keyId: key!.id });
      expect(error).toBeNull();

      const [, afterList] = await router.apiKeys.list({ projectId });
      expect(afterList?.apiKeys).toHaveLength(0);
    });
  });
});
