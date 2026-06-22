import { vi } from "vitest";
import { headers } from "next/headers";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { serverClient } from "@/lib/router";
import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { organization, projects } from "@ovr/db/schema";
import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";

vi.mock("next/headers");

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

const VIEWPORTS = [{ browser: "chromium" as const, viewportWidth: 1280 }];

const setApiKeyHeader = (key?: string) => {
  vi.mocked(headers).mockResolvedValue(new Headers(key ? { authorization: `Bearer ${key}` } : {}));
};

const createProjectWithApiKey = async () => {
  const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
  const projectId = addResult!.projectId;

  const [, keyResult] = await serverClient.apiKeys.create({ projectId, name: "ci" });

  return { projectId, apiKey: keyResult!.key };
};

describe("builds", () => {
  describe("createBuild", () => {
    test("should return UNAUTHORIZED when no api key is provided", async () => {
      setApiKeyHeader();

      const [error] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
      });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return UNAUTHORIZED for an invalid api key", async () => {
      setApiKeyHeader("ovr_api_key_invalid");

      const [error] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
      });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("creates a pending build under the project the key is scoped to", async ({ admin: _ }) => {
      const { projectId, apiKey } = await createProjectWithApiKey();

      setApiKeyHeader(apiKey);

      const [error, result] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: [
          { id: "story-a", title: "Story", name: "A" },
          { id: "story-b", title: "Story", name: "B" },
        ],
        viewports: VIEWPORTS,
      });

      expect(error).toBeNull();
      expect(result?.buildId).toBeTruthy();
      expect(result?.uploadUrl).toContain("http");

      const build = await dbClient.builds.findById(result!.buildId);
      expect(build).toMatchObject({
        projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        status: "pending",
      });
    });
  });

  describe("getBuildStatus", () => {
    test("should return UNAUTHORIZED when no api key is provided", async () => {
      setApiKeyHeader();

      const [error] = await serverClient.builds.getBuildStatus({ buildId: crypto.randomUUID() });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("returns the build status for a build in the key's project", async ({ admin: _ }) => {
      const { apiKey } = await createProjectWithApiKey();
      setApiKeyHeader(apiKey);

      const [, createResult] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
      });

      const [error, result] = await serverClient.builds.getBuildStatus({
        buildId: createResult!.buildId,
      });

      expect(error).toBeNull();
      expect(result?.status).toBe("pending");
      expect(result?.reviewUrl).toBeUndefined();
    });

    test("returns a reviewUrl when the build needs review", async ({ admin: _ }) => {
      const { projectId, apiKey } = await createProjectWithApiKey();
      setApiKeyHeader(apiKey);

      const [, createResult] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
      });
      const buildId = createResult!.buildId;

      await dbClient.builds.updateStatus(buildId, "needs_review");

      const [error, result] = await serverClient.builds.getBuildStatus({ buildId });

      expect(error).toBeNull();
      expect(result?.status).toBe("needs_review");
      expect(result?.reviewUrl).toBe(
        `http://localhost:3000/projects/${projectId}/builds/${buildId}`,
      );
    });

    test("returns FORBIDDEN for a build belonging to a different project", async ({ admin: _ }) => {
      const projectA = await createProjectWithApiKey();
      const projectB = await createProjectWithApiKey();

      setApiKeyHeader(projectB.apiKey);
      const [, createResult] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
      });

      setApiKeyHeader(projectA.apiKey);
      const [error] = await serverClient.builds.getBuildStatus({ buildId: createResult!.buildId });

      expect(error?.code).toBe("FORBIDDEN");
    });
  });

  describe("list", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      vi.mocked(headers).mockResolvedValue(new Headers());

      const [error] = await serverClient.builds.list();

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return an empty list when the organization has no builds", async ({
      admin: _,
    }) => {
      const [error, result] = await serverClient.builds.list();

      expect(error).toBeNull();
      expect(result?.builds).toHaveLength(0);
      expect(result?.total).toBe(0);
    });

    test("should be accessible to a non-admin user", async ({ user: _ }) => {
      const [error] = await serverClient.builds.list();

      expect(error).toBeNull();
    });

    test("should return builds across all projects in the organization, most recent first", async ({
      admin,
    }) => {
      const [, projectA] = await serverClient.projects.add(TEST_PROJECT);
      const [, projectB] = await serverClient.projects.add({
        ...TEST_PROJECT,
        projectName: "Project B",
      });

      const older = await dbClient.builds.create({
        projectId: projectA!.projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: admin.id,
        createdAt: "2024-01-01T00:00:00.000Z",
      });

      const newer = await dbClient.builds.create({
        projectId: projectB!.projectId,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: admin.id,
        createdAt: "2024-01-02T00:00:00.000Z",
      });

      const [error, result] = await serverClient.builds.list();

      expect(error).toBeNull();
      expect(result?.total).toBe(2);
      expect(result?.builds.map((build) => build.id)).toEqual([newer!.id, older!.id]);
      expect(result?.builds[0]).toMatchObject({
        project: { id: projectB!.projectId, name: "Project B" },
        branch: "main",
        commitSha: "b".repeat(40),
        status: "pending",
      });
    });

    test("should only return builds for the given projects", async ({ admin }) => {
      const [, projectA] = await serverClient.projects.add(TEST_PROJECT);
      const [, projectB] = await serverClient.projects.add({
        ...TEST_PROJECT,
        projectName: "Project B",
      });

      await dbClient.builds.create({
        projectId: projectA!.projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: admin.id,
      });

      const buildB = await dbClient.builds.create({
        projectId: projectB!.projectId,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: admin.id,
      });

      const [error, result] = await serverClient.builds.list({ projectIds: [projectB!.projectId] });

      expect(error).toBeNull();
      expect(result?.total).toBe(1);
      expect(result?.builds.map((build) => build.id)).toEqual([buildB!.id]);
    });

    test("should only return builds matching the given status", async ({ admin }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);

      await dbClient.builds.create({
        projectId: project!.projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: admin.id,
      });

      const passedBuild = await dbClient.builds.create({
        projectId: project!.projectId,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: admin.id,
      });
      await dbClient.builds.updateStatus(passedBuild!.id, "passed");

      const [error, result] = await serverClient.builds.list({ status: "passed" });

      expect(error).toBeNull();
      expect(result?.builds.map((build) => build.id)).toEqual([passedBuild!.id]);
    });

    test("should respect the limit and offset params", async ({ admin }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);

      for (let i = 0; i < 3; i++) {
        await dbClient.builds.create({
          projectId: project!.projectId,
          branch: "main",
          commitSha: i.toString().repeat(40),
          artifactPath: `builds/${i}/artifact`,
          createdBy: admin.id,
          createdAt: `2024-01-0${i + 1}T00:00:00.000Z`,
        });
      }

      const [error, result] = await serverClient.builds.list({ limit: 2, offset: 1 });

      expect(error).toBeNull();
      expect(result?.builds).toHaveLength(2);
      expect(result?.total).toBe(3);
    });

    test("should not return builds belonging to other organizations", async ({ admin }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);

      await dbClient.builds.create({
        projectId: project!.projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: admin.id,
      });

      const [otherOrg] = await db
        .insert(organization)
        .values({
          id: crypto.randomUUID(),
          name: "Other Org",
          slug: crypto.randomUUID(),
          createdAt: new Date(),
        })
        .returning();

      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Org Project",
          gitMainBranch: "main",
          organizationId: otherOrg!.id,
          creatorId: admin.id,
        })
        .returning();

      await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: admin.id,
      });

      const [error, result] = await serverClient.builds.list();

      expect(error).toBeNull();
      expect(result?.total).toBe(1);
    });
  });

  describe("getOne", () => {
    test("should return NOT_FOUND for a build that does not exist", async ({ admin: _ }) => {
      const [error] = await serverClient.builds.getOne({
        buildId: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
      });

      expect(error?.code).toBe("NOT_FOUND");
    });

    test("should return NOT_FOUND for a build belonging to a different organization", async ({
      admin,
    }) => {
      const [otherOrg] = await db
        .insert(organization)
        .values({
          id: crypto.randomUUID(),
          name: "Other Org",
          slug: crypto.randomUUID(),
          createdAt: new Date(),
        })
        .returning();

      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Org Project",
          gitMainBranch: "main",
          organizationId: otherOrg!.id,
          creatorId: admin.id,
        })
        .returning();

      const build = await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: admin.id,
      });

      const [error] = await serverClient.builds.getOne({ buildId: build!.id });

      expect(error?.code).toBe("NOT_FOUND");
    });

    test("returns the build's metadata", async ({ admin }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);
      const build = await dbClient.builds.create({
        projectId: project!.projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: admin.id,
      });

      const [error, result] = await serverClient.builds.getOne({ buildId: build!.id });

      expect(error).toBeNull();
      expect(result?.build).toMatchObject({
        id: build!.id,
        project: { id: project!.projectId, name: TEST_PROJECT.projectName },
        branch: "main",
        commitSha: "a".repeat(40),
        status: "pending",
      });
    });
  });
});
