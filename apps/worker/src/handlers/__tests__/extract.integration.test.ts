import { dbClient } from "@ovr/db/client";

import { failed } from "../extract";
import { describe, expect, test } from "../../__tests__/fixtures";

describe("extract", () => {
  describe("failed", () => {
    test("should let the person who pushed the build know it failed, instead of leaving it stuck pending", async ({
      build,
    }) => {
      await failed({
        data: { buildId: build.id, artifactPath: build.artifactPath },
      });

      expect(await dbClient.builds.findById(build.id)).toMatchObject({ status: "error" });
    });
  });
});
