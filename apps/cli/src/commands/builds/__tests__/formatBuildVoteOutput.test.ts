import { describe, expect, it } from "vitest";

import { formatBuildVoteOutput } from "../vote";

const BUILD_ID = "01a092d6-b0aa-71bf-9312-dd8ef48a22fb";

describe("formatBuildVoteOutput", () => {
  it("should say the build was approved and what its status is now", () => {
    expect(formatBuildVoteOutput("approve", BUILD_ID, "approved")).toBe(
      `Approved every snapshot in build ${BUILD_ID} that needs review. The build's status is now approved.`,
    );
  });

  it("should show a build that still needs another reviewer", () => {
    expect(formatBuildVoteOutput("approve", BUILD_ID, "needs_review")).toBe(
      `Approved every snapshot in build ${BUILD_ID} that needs review. The build's status is now needs_review.`,
    );
  });

  it("should say the build was rejected", () => {
    expect(formatBuildVoteOutput("reject", BUILD_ID, "rejected")).toBe(
      `Rejected every snapshot in build ${BUILD_ID} that needs review. The build's status is now rejected.`,
    );
  });
});
