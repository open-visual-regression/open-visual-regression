import { describe, expect, it } from "vitest";

import type { BuildStatus } from "@ovr/api/contracts/builds";
import type { BuildProcessingStatus, BuildReviewStatus } from "@ovr/db/schema";

import { getBuildStatusOutput, isTerminalBuildStatus } from "../buildStatus";

const source = (processingStatus: BuildProcessingStatus, reviewStatus: BuildReviewStatus) => ({
  id: "018f0000-0000-7000-8000-000000000000",
  projectId: "018f0000-0000-7000-8000-000000000001",
  processingStatus,
  reviewStatus,
  errorMessage: null,
});

describe("isTerminalBuildStatus", () => {
  const cases: [BuildStatus, boolean][] = [
    ["queued", false],
    ["processing", false],
    ["needs_review", false],
    ["unchanged", true],
    ["auto_approved", true],
    ["approved", true],
    ["rejected", true],
    ["error", true],
    ["canceled", true],
  ];

  it.each(cases)("treats %s as terminal=%s", (status, expected) => {
    expect(isTerminalBuildStatus(status)).toBe(expected);
  });
});

describe("getBuildStatusOutput", () => {
  it("includes a review url when the build needs review", () => {
    const output = getBuildStatusOutput(source("success", "needs_review"));
    expect(output.status).toBe("needs_review");
    expect(output.reviewUrl).toBe(
      "http://localhost:3000/projects/018f0000-0000-7000-8000-000000000001/builds/018f0000-0000-7000-8000-000000000000",
    );
  });

  it("includes the error message when the build errored", () => {
    const output = getBuildStatusOutput({
      ...source("error", "not_required"),
      errorMessage: "boom",
    });
    expect(output).toEqual({ status: "error", errorMessage: "boom" });
  });

  it("returns only the status for settled builds", () => {
    expect(getBuildStatusOutput(source("success", "approved"))).toEqual({ status: "approved" });
  });
});
