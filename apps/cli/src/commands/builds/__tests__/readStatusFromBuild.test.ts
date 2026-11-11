import { describe, expect, it, vi } from "vitest";

import type { BuildDetailSchema, BuildStatus } from "@ovr/api/contracts/builds";

import type { OvrClient } from "../../../client";
import { BuildFailedError, BuildNeedsReviewError, pollBuildStatus } from "../../upload/poll";
import { readStatusFromBuild } from "../rebuild";

type GetOne = OvrClient["builds"]["getOne"];

const BUILD: BuildDetailSchema = {
  id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
  project: { id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fc", name: "web" },
  branch: "main",
  commitSha: "a1b2c3d4e5f6",
  name: null,
  author: null,
  errorMessage: null,
  status: "queued",
  buildType: "storybook",
  createdAt: "2026-09-12T10:43:15Z",
  queuedMs: null,
  processingMs: null,
  durationMs: null,
  canceledBy: null,
  isRebuildable: false,
  isReviewable: false,
  latestBuildId: null,
  commitUrl: null,
  branchUrl: null,
  mainBranch: "main",
  mainBranchUrl: null,
  baseBuild: null,
};

const pollBuild = (getOne: GetOne) =>
  pollBuildStatus({
    client: readStatusFromBuild({ builds: { getOne } }),
    buildId: BUILD.id,
    timeoutSeconds: 10,
    pollIntervalMs: 1,
  });

const withStatus = (status: BuildStatus, errorMessage: string | null = null) => ({
  build: { ...BUILD, status, errorMessage },
});

describe("readStatusFromBuild", () => {
  it("should wait until the build it reads has passed", async () => {
    const getOne = vi
      .fn<GetOne>()
      .mockResolvedValueOnce(withStatus("processing"))
      .mockResolvedValue(withStatus("unchanged"));

    await expect(pollBuild(getOne)).resolves.toBeUndefined();
    expect(getOne).toHaveBeenCalledWith({ buildId: BUILD.id });
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
