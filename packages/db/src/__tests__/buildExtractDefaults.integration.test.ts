import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

const TARGETS = [
  { id: "story-a", title: "Story", name: "A" },
  { id: "story-b", title: "Story", name: "B" },
];

const VIEWPORTS = [{ name: "desktop", browser: "chromium", viewportWidth: 1280 }];

describe("buildExtractDefaults", () => {
  describe("create", () => {
    test("should store the extract defaults for a build", async ({ build }) => {
      await dbClient.buildExtractDefaults.create({
        buildId: build.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });

      expect(await dbClient.buildExtractDefaults.findByBuild(build.id)).toMatchObject({
        buildId: build.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });
    });

    test("should keep the first extract defaults when the upload is confirmed again", async ({
      build,
    }) => {
      await dbClient.buildExtractDefaults.create({
        buildId: build.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });

      const retried = await dbClient.buildExtractDefaults.create({
        buildId: build.id,
        targets: [{ id: "story-c", title: "Story", name: "C" }],
        viewports: VIEWPORTS,
        diffThreshold: 0.5,
      });

      expect(retried).toBeUndefined();
      expect(await dbClient.buildExtractDefaults.findByBuild(build.id)).toMatchObject({
        targets: TARGETS,
        diffThreshold: 0.05,
      });
    });
  });

  describe("findByBuild", () => {
    test("should return undefined when no extract defaults have been stored", async ({ build }) => {
      expect(await dbClient.buildExtractDefaults.findByBuild(build.id)).toBeUndefined();
    });

    test("should return undefined once the build has been purged", async ({ build }) => {
      await dbClient.buildExtractDefaults.create({
        buildId: build.id,
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });

      await dbClient.transaction((tx) => dbClient.builds.removeMany(tx, [build.id]));

      expect(await dbClient.buildExtractDefaults.findByBuild(build.id)).toBeUndefined();
    });
  });
});
