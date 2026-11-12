import { describe, expect, it, vi } from "vitest";

import type { BuildStatus } from "@ovr/api/contracts/builds";
import { mocks } from "@ovr/mocks";

import type { OvrClient } from "../../../client";
import { BuildFailedError, BuildNeedsReviewError, pollBuildStatus } from "../../upload/poll";
import { readStatusFromBuild } from "../rebuild";

type GetOne = OvrClient["builds"]["getOne"];

const BUILD_ID = "01a092d6-b0aa-71bf-9312-dd8ef48a22fb";

const pollBuild = (getOne: GetOne) =>
  pollBuildStatus({
    client: readStatusFromBuild({ builds: { getOne } }),
    buildId: BUILD_ID,
    timeoutSeconds: 10,
    pollIntervalMs: 1,
  });

const withStatus = (status: BuildStatus, errorMessage: string | null = null) => ({
  build: mocks.build.generateBuild({ id: BUILD_ID, status, errorMessage }),
});

describe("readStatusFromBuild", () => {
  it("should wait until the build it reads has passed", async () => {
    const getOne = vi
      .fn<GetOne>()
      .mockResolvedValueOnce(withStatus("processing"))
      .mockResolvedValue(withStatus("unchanged"));

    await expect(pollBuild(getOne)).resolves.toBeUndefined();
    expect(getOne).toHaveBeenCalledWith({ buildId: BUILD_ID });
  });

  it("should say the build needs review without a review link", async () => {
    const getOne = vi.fn<GetOne>().mockResolvedValue(withStatus("needs_review"));

    const promise = pollBuild(getOne);

    await expect(promise).rejects.toBeInstanceOf(BuildNeedsReviewError);
    await expect(promise).rejects.toThrow(/^Build needs review$/);
  });

  it("should pass on the build's error message", async () => {
    const getOne = vi.fn<GetOne>().mockResolvedValue(withStatus("error", "storybook did not load"));

    const promise = pollBuild(getOne);

    await expect(promise).rejects.toBeInstanceOf(BuildFailedError);
    await expect(promise).rejects.toThrow("Build finished with an error: storybook did not load");
  });
});
