import { dbClient } from "@ovr/db/client";

import { describe, expect, test } from "../../__tests__/fixtures";
import { failed } from "../extract";

describe("extract", () => {
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
