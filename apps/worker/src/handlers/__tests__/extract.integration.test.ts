import { dbClient } from "@ovr/db/client";

import { extractFailed } from "../extract";
import { describe, expect, test } from "../../__tests__/fixtures";

describe("extract", () => {
  describe("extractFailed", () => {
    test("marks the build as errored", async ({ build }) => {
      await extractFailed({
        data: { buildId: build.id, artifactPath: build.artifactPath },
      });

      expect(await dbClient.builds.findById(build.id)).toMatchObject({ status: "error" });
    });
  });
});
