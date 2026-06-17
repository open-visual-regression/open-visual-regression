import { dbClient } from "@ovr/db/client";

import { handleExtractFailed } from "../extract";
import { describe, expect, test } from "../../__tests__/fixtures";

describe("extract", () => {
  describe("handleExtractFailed", () => {
    test("marks the build as errored", async ({ build }) => {
      await handleExtractFailed({
        data: { buildId: build.id, artifactPath: build.artifactPath },
      } as never);

      expect(await dbClient.builds.findById(build.id)).toMatchObject({ status: "error" });
    });
  });
});
