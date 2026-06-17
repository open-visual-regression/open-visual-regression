import { dbClient } from "@ovr/db/client";

import { extractFailed } from "../extract";
import { describe, expect, test } from "../../__tests__/fixtures";

describe("extract", () => {
  describe("extractFailed", () => {
    test("should let the person who pushed the build know it failed, instead of leaving it stuck pending", async ({
      build,
    }) => {
      await extractFailed({
        data: { buildId: build.id, artifactPath: build.artifactPath },
      });

      expect(await dbClient.builds.findById(build.id)).toMatchObject({ status: "error" });
    });
  });
});
