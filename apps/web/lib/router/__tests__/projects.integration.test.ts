import { vi } from "vitest";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { router } from "@/lib/router";
import type { AddProjectInput } from "@ovr/api/contracts/projects";

vi.mock("next/headers");

const NONEXISTENT_PROJECT_ID = "01900000-0000-7000-8000-000000000000";

const TEST_PROJECT: AddProjectInput = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
  diffThreshold: 0.05,
};

describe("projects", () => {
  describe("list", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.projects.list();
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return an empty list when the admin has no projects", async ({ admin: _ }) => {
      const [error, result] = await router.projects.list();
      expect(error).toBeNull();
      expect(result?.projects).toHaveLength(0);
    });

    test("should return all projects belonging to the organization", async ({ admin: _ }) => {
      await router.projects.add(TEST_PROJECT);
      await router.projects.add({ ...TEST_PROJECT, projectName: "Second Project" });

      const [error, result] = await router.projects.list();

      expect(error).toBeNull();
      expect(result?.projects).toHaveLength(2);
    });

    test("should return projects with the correct shape", async ({ admin: _ }) => {
      await router.projects.add(TEST_PROJECT);

      const [error, result] = await router.projects.list();

      expect(error).toBeNull();
      expect(result?.projects[0]).toMatchObject({
        name: TEST_PROJECT.projectName,
        description: TEST_PROJECT.projectDescription,
        gitMainBranch: TEST_PROJECT.gitMainBranch,
        diffThreshold: TEST_PROJECT.diffThreshold,
      });
    });
  });

  describe("getOne", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.projects.getOne({ projectId: NONEXISTENT_PROJECT_ID });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return NOT_FOUND for an unknown project ID", async ({ admin: _ }) => {
      const [error] = await router.projects.getOne({ projectId: NONEXISTENT_PROJECT_ID });
      expect(error?.code).toBe("NOT_FOUND");
    });

    test("should return the project for a valid project ID", async ({ admin: _ }) => {
      const [, addResult] = await router.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await router.projects.getOne({ projectId });

      expect(error).toBeNull();
      expect(result?.project).toMatchObject({
        name: TEST_PROJECT.projectName,
        gitMainBranch: TEST_PROJECT.gitMainBranch,
        diffThreshold: TEST_PROJECT.diffThreshold,
      });
    });

    test("should return the project with creator info", async ({ admin }) => {
      const [, addResult] = await router.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await router.projects.getOne({ projectId });

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
      const [error] = await router.projects.add(TEST_PROJECT);
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await router.projects.add(TEST_PROJECT);
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return the project ID when created by an admin", async ({ admin: _ }) => {
      const [error, result] = await router.projects.add(TEST_PROJECT);

      expect(error).toBeNull();
      expect(result?.projectId).toBeDefined();
    });

    test("should persist the project to the database", async ({ admin: _ }) => {
      await router.projects.add(TEST_PROJECT);

      const [, listResult] = await router.projects.list();

      expect(listResult?.projects).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: TEST_PROJECT.projectName })]),
      );
    });
  });
});
