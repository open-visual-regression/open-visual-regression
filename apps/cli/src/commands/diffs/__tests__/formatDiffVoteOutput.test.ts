import { describe, expect, it } from "vitest";

import { formatDiffVoteOutput } from "../vote";

const SNAPSHOT_ID = "01a092d6-b0aa-71bf-9312-dd8ef48a22fb";

describe("formatDiffVoteOutput", () => {
  it("should say the snapshot was approved and what its review status is now", () => {
    expect(formatDiffVoteOutput("approve", SNAPSHOT_ID, "approved")).toBe(
      `Approved snapshot ${SNAPSHOT_ID}. Its review status is now approved.`,
    );
  });

  it("should say the snapshot was rejected", () => {
    expect(formatDiffVoteOutput("reject", SNAPSHOT_ID, "rejected")).toBe(
      `Rejected snapshot ${SNAPSHOT_ID}. Its review status is now rejected.`,
    );
  });
});
