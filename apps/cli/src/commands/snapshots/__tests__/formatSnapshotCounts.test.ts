import { describe, expect, it } from "vitest";

import type { SnapshotCountsSchema } from "@ovr/api/contracts/snapshots";

import { formatSnapshotCounts } from "../snapshotCounts";

const EMPTY_COUNTS: SnapshotCountsSchema = {
  unchanged: 0,
  auto_approved: 0,
  approved: 0,
  needs_review: 0,
  rejected: 0,
  error: 0,
  canceled: 0,
  skipped: 0,
  queued: 0,
  processing: 0,
};

describe("formatSnapshotCounts", () => {
  it("should report that a build has no snapshots", () => {
    expect(formatSnapshotCounts(EMPTY_COUNTS)).toBe("No snapshots found.");
  });

  it("should list only the statuses the build has", () => {
    const output = formatSnapshotCounts({ ...EMPTY_COUNTS, unchanged: 41, needs_review: 3 });

    expect(output).toContain("unchanged");
    expect(output).toContain("needs_review");
    expect(output).not.toContain("canceled");
  });

  it("should total the snapshots it counted", () => {
    expect(formatSnapshotCounts({ ...EMPTY_COUNTS, unchanged: 41, needs_review: 3 })).toContain(
      "TOTAL",
    );
    expect(formatSnapshotCounts({ ...EMPTY_COUNTS, unchanged: 41, needs_review: 3 })).toMatch(
      /TOTAL\s+44/,
    );
  });

  it("should order the statuses the way the contract does", () => {
    const output = formatSnapshotCounts({ ...EMPTY_COUNTS, needs_review: 3, unchanged: 41 });

    expect(output.indexOf("unchanged")).toBeLessThan(output.indexOf("needs_review"));
  });
});
