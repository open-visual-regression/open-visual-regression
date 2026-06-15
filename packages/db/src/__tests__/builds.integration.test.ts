import { v7 as uuidv7 } from "uuid";

import { db } from "../db";
import { dbClient } from "../client";
import { organization as organizationTable, projects } from "../schema";
import { describe, expect, test } from "./fixtures";

describe("builds", () => {
  describe("create", () => {
    test("should create a build with pending status and worker capture mode by default", async ({
      project,
      user,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/test/artifact",
        createdBy: user.id,
      });

      expect(build?.status).toBe("pending");
      expect(build?.captureMode).toBe("worker");
    });
  });

  describe("findById", () => {
    test("should return the build matching the given id", async ({ build }) => {
      const found = await dbClient.builds.findById(build.id);
      expect(found?.id).toBe(build.id);
    });
  });

  describe("updateStatus", () => {
    test("should update the build's status", async ({ build }) => {
      const updated = await dbClient.builds.updateStatus(build.id, "passed");
      expect(updated?.status).toBe("passed");
    });
  });

  describe("findByProject", () => {
    test("should only return builds matching the given branch", async ({
      project,
      user,
      build: main,
    }) => {
      await dbClient.builds.create({
        projectId: project.id,
        branch: "feature",
        commitSha: "b".repeat(40),
        artifactPath: "builds/feature/artifact",
        createdBy: user.id,
      });

      const builds = await dbClient.builds.findByProject(project.id, { branch: "main" });
      expect(builds.map((build) => build.id)).toEqual([main.id]);
    });

    test("should only return builds matching the given status", async ({
      project,
      user,
      build: main,
    }) => {
      await dbClient.builds.create({
        projectId: project.id,
        branch: "feature",
        commitSha: "b".repeat(40),
        artifactPath: "builds/feature/artifact",
        createdBy: user.id,
      });
      await dbClient.builds.updateStatus(main.id, "passed");

      const builds = await dbClient.builds.findByProject(project.id, { status: "passed" });
      expect(builds.map((build) => build.id)).toEqual([main.id]);
    });

    test("should return all builds for the project when no filters are given", async ({
      project,
      user,
      build: _main,
    }) => {
      await dbClient.builds.create({
        projectId: project.id,
        branch: "feature",
        commitSha: "b".repeat(40),
        artifactPath: "builds/feature/artifact",
        createdBy: user.id,
      });

      const builds = await dbClient.builds.findByProject(project.id);
      expect(builds).toHaveLength(2);
    });
  });

  describe("findAll", () => {
    test("should return builds across all projects in the organization, most recent first", async ({
      organization,
      project,
      user,
    }) => {
      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Project",
          diffThreshold: 0.1,
          gitMainBranch: "main",
          organizationId: organization.id,
          creatorId: user.id,
        })
        .returning();

      const older = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
        createdAt: "2024-01-01T00:00:00.000Z",
      });

      const newer = await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
        createdAt: "2024-01-02T00:00:00.000Z",
      });

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        limit: 10,
        offset: 0,
      });

      expect(total).toBe(2);
      expect(builds.map((build) => build.id)).toEqual([newer!.id, older!.id]);
      expect(builds[0]).toMatchObject({
        projectId: otherProject!.id,
        projectName: "Other Project",
        branch: "main",
        commitSha: "b".repeat(40),
        status: "pending",
      });
    });

    test("should not return builds belonging to other organizations", async ({
      organization,
      project,
      user,
    }) => {
      const [otherOrg] = await db
        .insert(organizationTable)
        .values({ id: uuidv7(), name: "Other Org", slug: uuidv7(), createdAt: new Date() })
        .returning();

      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Org Project",
          diffThreshold: 0.1,
          gitMainBranch: "main",
          organizationId: otherOrg!.id,
          creatorId: user.id,
        })
        .returning();

      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
      });

      await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        limit: 10,
        offset: 0,
      });

      expect(total).toBe(1);
      expect(builds.map((build) => build.projectId)).toEqual([project.id]);
    });

    test("should only return builds for the given projects", async ({
      organization,
      project,
      user,
    }) => {
      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Project",
          diffThreshold: 0.1,
          gitMainBranch: "main",
          organizationId: organization.id,
          creatorId: user.id,
        })
        .returning();

      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
      });

      const otherProjectBuild = await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        projectIds: [otherProject!.id],
        limit: 10,
        offset: 0,
      });

      expect(total).toBe(1);
      expect(builds.map((build) => build.id)).toEqual([otherProjectBuild!.id]);
    });

    test("should only return builds matching the given status", async ({
      organization,
      project,
      user,
      build: pendingBuild,
    }) => {
      const passedBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });
      await dbClient.builds.updateStatus(passedBuild!.id, "passed");

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        status: "passed",
        limit: 10,
        offset: 0,
      });

      expect(total).toBe(1);
      expect(builds.map((build) => build.id)).toEqual([passedBuild!.id]);
      expect(pendingBuild.status).toBe("pending");
    });

    test("should respect the limit and offset params", async ({ organization, project, user }) => {
      for (let i = 0; i < 3; i++) {
        await dbClient.builds.create({
          projectId: project.id,
          branch: "main",
          commitSha: i.toString().repeat(40),
          artifactPath: `builds/${i}/artifact`,
          createdBy: user.id,
          createdAt: `2024-01-0${i + 1}T00:00:00.000Z`,
        });
      }

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        limit: 2,
        offset: 1,
      });

      expect(total).toBe(3);
      expect(builds).toHaveLength(2);
      expect(builds.map((build) => build.commitSha)).toEqual(["1".repeat(40), "0".repeat(40)]);
    });

    test("should return the oldest builds first when sorted ascending", async ({
      organization,
      project,
      user,
    }) => {
      const older = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
        createdAt: "2024-01-01T00:00:00.000Z",
      });

      const newer = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
        createdAt: "2024-01-02T00:00:00.000Z",
      });

      const { builds } = await dbClient.builds.findAll({
        organizationId: organization.id,
        sortDirection: "asc",
        limit: 10,
        offset: 0,
      });

      expect(builds.map((build) => build.id)).toEqual([older!.id, newer!.id]);
    });
  });
});
