import { describe, expect, it } from "vitest";

import type { SnapshotCountsSchema } from "@ovr/api/contracts/snapshots";

import { formatSnapshotCountsOutput } from "../snapshotCounts";

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

describe("formatSnapshotCountsOutput", () => {
  it("should print every status as JSON when json is true", () => {
    expect(formatSnapshotCountsOutput(EMPTY_COUNTS, true)).toBe(
      JSON.stringify(EMPTY_COUNTS, null, 2),
    );
  });

  it("should print a table when json is false", () => {
    expect(formatSnapshotCountsOutput({ ...EMPTY_COUNTS, unchanged: 1 }, false)).toContain(
      "STATUS",
    );
  });
});
