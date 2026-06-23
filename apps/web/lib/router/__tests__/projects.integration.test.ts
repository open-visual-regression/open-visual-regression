import { vi } from "vitest";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { serverClient } from "@/lib/router";
import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";

vi.mock("next/headers");

const NONEXISTENT_PROJECT_ID = "01900000-0000-7000-8000-000000000000";

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

describe("projects", () => {
  describe("list", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.projects.list();
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return an empty list when the admin has no projects", async ({ admin: _ }) => {
      const [error, result] = await serverClient.projects.list();
      expect(error).toBeNull();
      expect(result?.projects).toHaveLength(0);
    });

    test("should return all projects belonging to the organization", async ({ admin: _ }) => {
      await serverClient.projects.add(TEST_PROJECT);
      await serverClient.projects.add({ ...TEST_PROJECT, projectName: "Second Project" });

      const [error, result] = await serverClient.projects.list();

      expect(error).toBeNull();
      expect(result?.projects).toHaveLength(2);
    });

    test("should return projects with the correct shape", async ({ admin: _ }) => {
      await serverClient.projects.add(TEST_PROJECT);

      const [error, result] = await serverClient.projects.list();

      expect(error).toBeNull();
      expect(result?.projects[0]).toMatchObject({
        name: TEST_PROJECT.projectName,
        description: TEST_PROJECT.projectDescription,
        gitMainBranch: TEST_PROJECT.gitMainBranch,
        retentionDays: 90,
      });
    });

    test("should respect the limit and offset params", async ({ admin: _ }) => {
      await serverClient.projects.add(TEST_PROJECT);
      await serverClient.projects.add({ ...TEST_PROJECT, projectName: "Second Project" });
      await serverClient.projects.add({ ...TEST_PROJECT, projectName: "Third Project" });

      const [error, result] = await serverClient.projects.list({ limit: 1, offset: 1 });

      expect(error).toBeNull();
      expect(result?.projects).toHaveLength(1);
      expect(result?.projects[0]?.name).toBe("Second Project");
    });
  });

  describe("count", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.projects.count();
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return 0 when the admin has no projects", async ({ admin: _ }) => {
      const [error, result] = await serverClient.projects.count();
      expect(error).toBeNull();
      expect(result?.total).toBe(0);
    });

    test("should return the total number of projects belonging to the organization", async ({
      admin: _,
    }) => {
      await serverClient.projects.add(TEST_PROJECT);
      await serverClient.projects.add({ ...TEST_PROJECT, projectName: "Second Project" });

      const [error, result] = await serverClient.projects.count();

      expect(error).toBeNull();
      expect(result?.total).toBe(2);
    });
  });

  describe("getOne", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.projects.getOne({ projectId: NONEXISTENT_PROJECT_ID });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return NOT_FOUND for an unknown project ID", async ({ admin: _ }) => {
      const [error] = await serverClient.projects.getOne({ projectId: NONEXISTENT_PROJECT_ID });
      expect(error?.code).toBe("NOT_FOUND");
    });

    test("should return the project for a valid project ID", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await serverClient.projects.getOne({ projectId });

      expect(error).toBeNull();
      expect(result?.project).toMatchObject({
        name: TEST_PROJECT.projectName,
        gitMainBranch: TEST_PROJECT.gitMainBranch,
        retentionDays: 90,
      });
    });

    test("should return the project with creator info", async ({ admin }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await serverClient.projects.getOne({ projectId });

      expect(error).toBeNull();
      expect(result?.project.creator).toMatchObject({
        id: admin.id,
        name: admin.name,
        email: admin.email,
      });
    });
  });

  describe("add", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.projects.add(TEST_PROJECT);
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await serverClient.projects.add(TEST_PROJECT);
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return the project ID when created by an admin", async ({ admin: _ }) => {
      const [error, result] = await serverClient.projects.add(TEST_PROJECT);

      expect(error).toBeNull();
      expect(result?.projectId).toBeDefined();
    });

    test("should persist the project to the database", async ({ admin: _ }) => {
      await serverClient.projects.add(TEST_PROJECT);

      const [, listResult] = await serverClient.projects.list();

      expect(listResult?.projects).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: TEST_PROJECT.projectName })]),
      );
    });
  });

  describe("update", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.projects.update({
        id: NONEXISTENT_PROJECT_ID,
        patch: { retentionDays: 30 },
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await serverClient.projects.update({
        id: NONEXISTENT_PROJECT_ID,
        patch: { retentionDays: 30 },
      });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return NOT_FOUND for an unknown project ID", async ({ admin: _ }) => {
      const [error] = await serverClient.projects.update({
        id: NONEXISTENT_PROJECT_ID,
        patch: { retentionDays: 30 },
      });
      expect(error?.code).toBe("NOT_FOUND");
    });

    test("should return BAD_REQUEST when retentionDays is less than 1", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error] = await serverClient.projects.update({
        id: projectId,
        patch: { retentionDays: 0 },
      });

      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should update the project with a valid patch", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error] = await serverClient.projects.update({
        id: projectId,
        patch: { name: "Updated Name", retentionDays: 30 },
      });

      expect(error).toBeNull();

      const [, getResult] = await serverClient.projects.getOne({ projectId });
      expect(getResult?.project).toMatchObject({ name: "Updated Name", retentionDays: 30 });
    });
  });
});
