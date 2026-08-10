import { headers } from "next/headers";
import { v7 as uuidv7 } from "uuid";
import { vi } from "vitest";

import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";
import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { organization, projects } from "@ovr/db/schema";
import { storage } from "@ovr/storage";

import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

const VIEWPORTS = [{ name: "desktop", browser: "chromium" as const, viewportWidth: 1280 }];

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
      });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return UNAUTHORIZED for an invalid api key", async () => {
      setApiKeyHeader("ovr_api_key_invalid");

      const [error] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
      });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("cancels the previous in-flight build on the branch it is pushed to", async ({
      admin: _,
    }) => {
      const { apiKey } = await createProjectWithApiKey();
      setApiKeyHeader(apiKey);

      const [, superseded] = await serverClient.builds.createBuild({
        branch: "feature/checkout",
        commitSha: "a".repeat(40),
      });

      const [, latest] = await serverClient.builds.createBuild({
        branch: "feature/checkout",
        commitSha: "b".repeat(40),
      });

      expect(await dbClient.builds.findById(superseded!.buildId)).toMatchObject({
        processingStatus: "canceled",
        canceledBy: null,
      });
      expect(await dbClient.builds.findById(latest!.buildId)).toMatchObject({
        processingStatus: "queued",
      });
    });

    test("creates a queued build under the project the key is scoped to", async ({ admin: _ }) => {
      const { projectId, apiKey } = await createProjectWithApiKey();

      setApiKeyHeader(apiKey);

      const [error, result] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
      });

      expect(error).toBeNull();
      expect(result?.buildId).toBeTruthy();
      expect(result?.uploadUrl).toContain("http");

      const build = await dbClient.builds.findById(result!.buildId);
      expect(build).toMatchObject({
        projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        processingStatus: "queued",
        reviewStatus: "not_required",
      });
    });
  });

  describe("confirmUpload", () => {
    test("should return UNAUTHORIZED when no api key is provided", async () => {
      setApiKeyHeader();

      const [error] = await serverClient.builds.confirmUpload({
        buildId: crypto.randomUUID(),
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
      });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return NOT_FOUND for a build outside the key's project", async ({ admin: _ }) => {
      const projectA = await createProjectWithApiKey();
      const projectB = await createProjectWithApiKey();

      setApiKeyHeader(projectB.apiKey);
      const [, createResult] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
      });

      setApiKeyHeader(projectA.apiKey);
      const [error] = await serverClient.builds.confirmUpload({
        buildId: createResult!.buildId,
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
      });

      expect(error?.code).toBe("NOT_FOUND");
    });

    test("should return PRECONDITION_FAILED when the artifact was never uploaded", async ({
      admin: _,
    }) => {
      const { apiKey } = await createProjectWithApiKey();
      setApiKeyHeader(apiKey);

      const [, createResult] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
      });

      const [error] = await serverClient.builds.confirmUpload({
        buildId: createResult!.buildId,
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
      });

      expect(error?.code).toBe("PRECONDITION_FAILED");
    });

    test("enqueues extraction once the artifact has been uploaded", async ({ admin: _ }) => {
      const { apiKey } = await createProjectWithApiKey();
      setApiKeyHeader(apiKey);

      const [, createResult] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
      });
      const buildId = createResult!.buildId;

      const build = await dbClient.builds.findById(buildId);
      await storage.uploadFile(build!.artifactPath, Buffer.from(""), "application/gzip");

      const [error, result] = await serverClient.builds.confirmUpload({
        buildId,
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
      });

      expect(error).toBeNull();
      expect(result).toEqual({ ok: true });
    });

    test("should return CONFLICT when a newer build superseded this one mid-upload", async ({
      admin: _,
    }) => {
      const { apiKey } = await createProjectWithApiKey();
      setApiKeyHeader(apiKey);

      const [, createResult] = await serverClient.builds.createBuild({
        branch: "feature/checkout",
        commitSha: "a".repeat(40),
      });
      const buildId = createResult!.buildId;

      const build = await dbClient.builds.findById(buildId);
      await storage.uploadFile(build!.artifactPath, Buffer.from(""), "application/gzip");

      await serverClient.builds.createBuild({
        branch: "feature/checkout",
        commitSha: "b".repeat(40),
      });

      const [error] = await serverClient.builds.confirmUpload({
        buildId,
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
      });

      expect(error?.code).toBe("CONFLICT");
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
      });

      const [error, result] = await serverClient.builds.getBuildStatus({
        buildId: createResult!.buildId,
      });

      expect(error).toBeNull();
      expect(result?.status).toBe("queued");
      expect(result?.reviewUrl).toBeUndefined();
    });

    test("returns a reviewUrl when the build needs review", async ({ admin: _ }) => {
      const { projectId, apiKey } = await createProjectWithApiKey();
      setApiKeyHeader(apiKey);

      const [, createResult] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
      });
      const buildId = createResult!.buildId;

      await dbClient.builds.updateResult(buildId, {
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

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
      });

      setApiKeyHeader(projectA.apiKey);
      const [error] = await serverClient.builds.getBuildStatus({ buildId: createResult!.buildId });

      expect(error?.code).toBe("FORBIDDEN");
    });
  });

  describe("cancel", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      vi.mocked(headers).mockResolvedValue(new Headers());

      const [error] = await serverClient.builds.cancel({ buildId: uuidv7() });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("cancels an in-progress build and records the canceling user", async ({ admin }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);
      const build = await dbClient.builds.create({
        projectId: project!.projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: admin.id,
        processingStatus: "processing",
      });

      const [error, result] = await serverClient.builds.cancel({ buildId: build!.id });

      expect(error).toBeNull();
      expect(result).toEqual({ ok: true });
      expect(await dbClient.builds.findById(build!.id)).toMatchObject({
        processingStatus: "canceled",
        canceledBy: admin.id,
      });
    });

    test("should return CONFLICT when the build has already finished", async ({ admin }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);
      const build = await dbClient.builds.create({
        projectId: project!.projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: admin.id,
        processingStatus: "success",
      });

      const [error] = await serverClient.builds.cancel({ buildId: build!.id });

      expect(error?.code).toBe("CONFLICT");
    });

    test("should return NOT_FOUND for a build outside the user's organization", async ({
      admin: _,
    }) => {
      const [error] = await serverClient.builds.cancel({ buildId: uuidv7() });

      expect(error?.code).toBe("NOT_FOUND");
    });

    test("should return FORBIDDEN for a viewer", async ({ viewer: _ }) => {
      const [error] = await serverClient.builds.cancel({ buildId: uuidv7() });

      expect(error?.code).toBe("FORBIDDEN");
    });
  });

  describe("rebuild", () => {
    const seedRebuildableBuild = async (projectId: string, userId: string) => {
      const build = await dbClient.builds.create({
        projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: `${projectId}/builds/seed/artifact.tar.gz`,
        createdBy: userId,
        processingStatus: "success",
      });

      await storage.uploadFile(build!.artifactPath, Buffer.from("artifact"), "application/gzip");
      await dbClient.buildExtractDefaults.create({
        buildId: build!.id,
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });

      return build!;
    };

    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      vi.mocked(headers).mockResolvedValue(new Headers());

      const [error] = await serverClient.builds.rebuild({ buildId: uuidv7() });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN for a viewer", async ({ viewer: _ }) => {
      const [error] = await serverClient.builds.rebuild({ buildId: uuidv7() });

      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return NOT_FOUND for a build outside the user's organization", async ({
      admin: _,
    }) => {
      const [error] = await serverClient.builds.rebuild({ buildId: uuidv7() });

      expect(error?.code).toBe("NOT_FOUND");
    });

    test("rebuilds the build and returns the new build's id", async ({ admin }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);
      const build = await seedRebuildableBuild(project!.projectId, admin.id);

      const [error, result] = await serverClient.builds.rebuild({ buildId: build.id });

      expect(error).toBeNull();
      expect(result?.buildId).not.toBe(build.id);
      expect(await dbClient.builds.findById(result!.buildId)).toMatchObject({
        commitSha: build.commitSha,
        processingStatus: "queued",
        createdBy: admin.id,
      });
    });

    test("should return CONFLICT when the build is still running", async ({ admin }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);
      const build = await seedRebuildableBuild(project!.projectId, admin.id);
      await dbClient.builds.updateProcessingStatus(build.id, "processing");

      const [error] = await serverClient.builds.rebuild({ buildId: build.id });

      expect(error?.code).toBe("CONFLICT");
    });

    test("should return CONFLICT when a newer build has landed on the branch", async ({
      admin,
    }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);
      const build = await seedRebuildableBuild(project!.projectId, admin.id);
      await seedRebuildableBuild(project!.projectId, admin.id);

      const [error] = await serverClient.builds.rebuild({ buildId: build.id });

      expect(error?.code).toBe("CONFLICT");
      expect(error?.message).toContain("newer build");
    });

    test("should return PRECONDITION_FAILED when the artifact has been purged", async ({
      admin,
    }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);
      const build = await seedRebuildableBuild(project!.projectId, admin.id);
      await storage.deleteFile(build.artifactPath);

      const [error] = await serverClient.builds.rebuild({ buildId: build.id });

      expect(error?.code).toBe("PRECONDITION_FAILED");
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

    test("should be accessible to a non-admin user", async ({ reviewer: _ }) => {
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
        status: "queued",
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

    test("should only return builds with a name matching the search term", async ({ admin }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);

      const matchingBuild = await dbClient.builds.create({
        projectId: project!.projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        name: "fix: cart total rounding",
        artifactPath: "builds/a/artifact",
        createdBy: admin.id,
      });

      await dbClient.builds.create({
        projectId: project!.projectId,
        branch: "main",
        commitSha: "b".repeat(40),
        name: "feat: add checkout flow",
        artifactPath: "builds/b/artifact",
        createdBy: admin.id,
      });

      const [error, result] = await serverClient.builds.list({ search: "cart" });

      expect(error).toBeNull();
      expect(result?.total).toBe(1);
      expect(result?.builds.map((build) => build.id)).toEqual([matchingBuild!.id]);
    });

    test("should only return builds matching the given processing status", async ({ admin }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);

      await dbClient.builds.create({
        projectId: project!.projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: admin.id,
      });

      const successBuild = await dbClient.builds.create({
        projectId: project!.projectId,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: admin.id,
      });
      await dbClient.builds.updateProcessingStatus(successBuild!.id, "success");

      const [error, result] = await serverClient.builds.list({ processingStatus: "success" });

      expect(error).toBeNull();
      expect(result?.builds.map((build) => build.id)).toEqual([successBuild!.id]);
    });

    test("should paginate with the limit and cursor params", async ({ admin }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);

      const created = [];
      for (let i = 0; i < 3; i++) {
        created.push(
          await dbClient.builds.create({
            projectId: project!.projectId,
            branch: "main",
            commitSha: i.toString().repeat(40),
            artifactPath: `builds/${i}/artifact`,
            createdBy: admin.id,
            createdAt: `2024-01-0${i + 1}T00:00:00.000Z`,
          }),
        );
      }

      // Newest first: created[2], created[1], created[0].
      const [firstError, firstPage] = await serverClient.builds.list({ limit: 2 });

      expect(firstError).toBeNull();
      expect(firstPage?.total).toBe(3);
      expect(firstPage?.builds.map((build) => build.id)).toEqual([created[2]!.id, created[1]!.id]);
      expect(firstPage?.nextCursor).not.toBeNull();

      const [secondError, secondPage] = await serverClient.builds.list({
        limit: 2,
        cursor: firstPage!.nextCursor!,
      });

      expect(secondError).toBeNull();
      expect(secondPage?.builds.map((build) => build.id)).toEqual([created[0]!.id]);
      expect(secondPage?.nextCursor).toBeNull();
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
        status: "queued",
        isRebuildable: false,
      });
    });

    test("reports a settled build with stored extract defaults as rebuildable", async ({
      admin,
    }) => {
      const [, project] = await serverClient.projects.add(TEST_PROJECT);
      const build = await dbClient.builds.create({
        projectId: project!.projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: admin.id,
        processingStatus: "success",
      });
      await dbClient.buildExtractDefaults.create({
        buildId: build!.id,
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });

      const [, result] = await serverClient.builds.getOne({ buildId: build!.id });

      expect(result?.build).toMatchObject({ isRebuildable: true });
    });
  });
});
