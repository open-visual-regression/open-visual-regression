import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

const TARGETS = [
  { id: "story-a", title: "Story", name: "A" },
  { id: "story-b", title: "Story", name: "B" },
];

const VIEWPORTS = [{ name: "desktop", browser: "chromium", viewportWidth: 1280 }];

describe("buildExtractInputs", () => {
  describe("create", () => {
    test("stores the extract input for a build", async ({ build }) => {
      await dbClient.buildExtractInputs.create({
        buildId: build.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });

      const found = await dbClient.buildExtractInputs.findByBuild(build.id);
      expect(found).toMatchObject({
        buildId: build.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });
    });
  });

  describe("findByBuild", () => {
    test("returns undefined when no extract input has been stored", async ({ build }) => {
      expect(await dbClient.buildExtractInputs.findByBuild(build.id)).toBeUndefined();
    });
  });

  describe("copyToBuild", () => {
    test("copies the source build's extract input to the destination build", async ({
      project,
      user,
      build,
    }) => {
      await dbClient.buildExtractInputs.create({
        buildId: build.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });

      const destination = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/seed-2/artifact",
        createdBy: user.id,
      });

      await dbClient.buildExtractInputs.copyToBuild(build.id, destination!.id);

      expect(await dbClient.buildExtractInputs.findByBuild(destination!.id)).toMatchObject({
        buildId: destination!.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });
      expect(await dbClient.buildExtractInputs.findByBuild(build.id)).toMatchObject({
        buildId: build.id,
      });
    });

    test("returns undefined when the source build has no stored extract input", async ({
      project,
      user,
      build,
    }) => {
      const destination = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/seed-2/artifact",
        createdBy: user.id,
      });

      const result = await dbClient.buildExtractInputs.copyToBuild(build.id, destination!.id);

      expect(result).toBeUndefined();
      expect(await dbClient.buildExtractInputs.findByBuild(destination!.id)).toBeUndefined();
    });
  });
});
