import { describe, expect, it } from "@/test-utils";

import { getSnapshotTimings } from "../snapshotTimings";

const QUEUED_AT = "2026-01-01T00:00:00.000Z";
const STARTED_AT = "2026-01-01T00:00:12.000Z";
const COMPLETED_AT = "2026-01-01T00:00:15.500Z";

describe("getSnapshotTimings", () => {
  it("should report nothing while the snapshot is queued", () => {
    expect(getSnapshotTimings({ queuedAt: QUEUED_AT, startedAt: null, completedAt: null })).toEqual(
      { queuedMs: null, processingMs: null },
    );
  });

  it("should report only the queued time while the snapshot is processing", () => {
    expect(
      getSnapshotTimings({ queuedAt: QUEUED_AT, startedAt: STARTED_AT, completedAt: null }),
    ).toEqual({ queuedMs: 12_000, processingMs: null });
  });

  it("should report both times once the snapshot has finished", () => {
    expect(
      getSnapshotTimings({ queuedAt: QUEUED_AT, startedAt: STARTED_AT, completedAt: COMPLETED_AT }),
    ).toEqual({ queuedMs: 12_000, processingMs: 3_500 });
  });

  it("should measure the queued time up to completion when the snapshot never started", () => {
    expect(
      getSnapshotTimings({ queuedAt: QUEUED_AT, startedAt: null, completedAt: COMPLETED_AT }),
    ).toEqual({ queuedMs: 15_500, processingMs: null });
  });

  it("should omit phases that took no time", () => {
    expect(
      getSnapshotTimings({ queuedAt: QUEUED_AT, startedAt: QUEUED_AT, completedAt: QUEUED_AT }),
    ).toEqual({ queuedMs: null, processingMs: null });
  });

  it("should report nothing for snapshots created before timings were tracked", () => {
    expect(getSnapshotTimings({ queuedAt: null, startedAt: null, completedAt: null })).toEqual({
      queuedMs: null,
      processingMs: null,
    });
  });
});
