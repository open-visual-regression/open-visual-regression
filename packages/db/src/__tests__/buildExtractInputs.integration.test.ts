import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

const TARGETS = [
  { id: "story-a", title: "Story", name: "A" },
  { id: "story-b", title: "Story", name: "B" },
];

const VIEWPORTS = [{ name: "desktop", browser: "chromium", viewportWidth: 1280 }];

describe("buildExtractInputs", () => {
  describe("create", () => {
    test("should store the extract input for a build", async ({ build }) => {
      await dbClient.buildExtractInputs.create({
        buildId: build.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });

      expect(await dbClient.buildExtractInputs.findByBuild(build.id)).toMatchObject({
        buildId: build.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });
    });

    test("should keep the first extract input when the upload is confirmed again", async ({
      build,
    }) => {
      await dbClient.buildExtractInputs.create({
        buildId: build.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });

      const retried = await dbClient.buildExtractInputs.create({
        buildId: build.id,
        targets: [{ id: "story-c", title: "Story", name: "C" }],
        viewports: VIEWPORTS,
        diffThreshold: 0.5,
      });

      expect(retried).toBeUndefined();
      expect(await dbClient.buildExtractInputs.findByBuild(build.id)).toMatchObject({
        targets: TARGETS,
        diffThreshold: 0.05,
      });
    });
  });

  describe("findByBuild", () => {
    test("should return undefined when no extract input has been stored", async ({ build }) => {
      expect(await dbClient.buildExtractInputs.findByBuild(build.id)).toBeUndefined();
    });

    test("should return undefined once the build has been purged", async ({ build }) => {
      await dbClient.buildExtractInputs.create({
        buildId: build.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });

      await dbClient.transaction((tx) => dbClient.builds.removeMany(tx, [build.id]));

      expect(await dbClient.buildExtractInputs.findByBuild(build.id)).toBeUndefined();
    });
  });
});
