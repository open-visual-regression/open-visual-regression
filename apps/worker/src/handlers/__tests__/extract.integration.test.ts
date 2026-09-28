import { dbClient } from "@ovr/db/client";

import { describe, expect, test } from "../../__tests__/fixtures";
import { failed, run } from "../extract";

describe("extract", () => {
  describe("run", () => {
    test.for(["success", "error", "canceled"] as const)(
      "should leave a %s build alone when its extract job runs again",
      async (processingStatus, { build }) => {
        await dbClient.builds.updateProcessingStatus(build.id, processingStatus);

        await run({
          data: {
            buildId: build.id,
            artifactPath: build.artifactPath,
            targets: [{ id: "story-a", title: "Story", name: "A" }],
            viewports: [{ browser: "chromium", viewportWidth: 1280 }],
            diffThreshold: 0.05,
          },
        });

        expect((await dbClient.builds.findById(build.id))?.processingStatus).toBe(processingStatus);
        expect(await dbClient.snapshots.findByBuild(build.id)).toHaveLength(0);
      },
    );
  });

  describe("failed", () => {
    test("should let the person who pushed the build know it failed, instead of leaving it stuck pending", async ({
      build,
    }) => {
      await failed({
        data: {
          buildId: build.id,
          artifactPath: build.artifactPath,
          targets: [],
          viewports: [],
          diffThreshold: 0.05,
        },
      });

      expect(await dbClient.builds.findById(build.id)).toMatchObject({
        processingStatus: "error",
        reviewStatus: "not_required",
      });
    });
  });
});
