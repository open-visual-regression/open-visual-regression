import { dbClient } from "../../client";
import { describe, expect, test } from "../fixtures";

describe("builds repository", () => {
  describe("create", () => {
    test("should create a build with pending status and worker capture mode by default", async ({
      project,
      user,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        storybookPath: "builds/test/storybook",
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
        storybookPath: "builds/feature/storybook",
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
        storybookPath: "builds/feature/storybook",
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
        storybookPath: "builds/feature/storybook",
        createdBy: user.id,
      });

      const builds = await dbClient.builds.findByProject(project.id);
      expect(builds).toHaveLength(2);
    });
  });
});
