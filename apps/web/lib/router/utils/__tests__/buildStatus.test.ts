import { isTerminalBuildStatus, type BuildStatus } from "@ovr/api/contracts/builds";
import type { BuildProcessingStatus, BuildReviewStatus } from "@ovr/db/schema";

import { describe, expect, it } from "@/test-utils";

import { getBuildStatusOutput } from "../buildStatus";

const source = (processingStatus: BuildProcessingStatus, reviewStatus: BuildReviewStatus) => ({
  id: "018f0000-0000-7000-8000-000000000000",
  projectId: "018f0000-0000-7000-8000-000000000001",
  processingStatus,
  reviewStatus,
  errorMessage: null,
});

describe("buildStatus", () => {
  it.each([
    ["queued", false],
    ["processing", false],
    ["needs_review", false],
    ["unchanged", true],
    ["auto_approved", true],
    ["approved", true],
    ["rejected", true],
    ["error", true],
    ["canceled", true],
  ] satisfies [BuildStatus, boolean][])("should report %s as terminal=%s", (status, expected) => {
    expect(isTerminalBuildStatus(status)).toBe(expected);
  });

  it("should include a review url when the build needs review", () => {
    expect(getBuildStatusOutput(source("success", "needs_review"))).toEqual({
      status: "needs_review",
      reviewUrl:
        "http://localhost:3000/projects/018f0000-0000-7000-8000-000000000001/builds/018f0000-0000-7000-8000-000000000000",
    });
  });

  it("should include the error message when the build errored", () => {
    const build = { ...source("error", "not_required"), errorMessage: "boom" };
    expect(getBuildStatusOutput(build)).toEqual({ status: "error", errorMessage: "boom" });
  });

  it("should return only the status for settled builds", () => {
    expect(getBuildStatusOutput(source("success", "approved"))).toEqual({ status: "approved" });
  });
});
