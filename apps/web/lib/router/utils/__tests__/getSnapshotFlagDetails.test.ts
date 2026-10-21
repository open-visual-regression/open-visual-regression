import type { FlakySnapshotDbSchema } from "@ovr/db/repository/flakySnapshots";

import { describe, expect, it } from "@/test-utils";

import { getSnapshotFlagDetails } from "../snapshotFlags";

const flakySnapshot = {
  sampleCount: 30,
  changeCount: 9,
  revertCount: 6,
  sameCommitMismatchCount: 1,
} as FlakySnapshotDbSchema;

describe("getSnapshotFlagDetails", () => {
  it("should return no flags for a snapshot that is neither flaky nor warned", () => {
    expect(
      getSnapshotFlagDetails({
        flakySnapshot: undefined,
        hasUncaughtPageError: false,
      }),
    ).toEqual([]);
  });

  it("should include the flaky detection stats of a flagged snapshot", () => {
    expect(
      getSnapshotFlagDetails({
        flakySnapshot,
        hasUncaughtPageError: false,
      }),
    ).toEqual([
      {
        flag: "flaky",
        detection: { sampleCount: 30, changeCount: 9, revertCount: 6, sameCommitMismatchCount: 1 },
        matchesEarlierVariant: false,
      },
    ]);
  });

  it("should list the flaky flag before the warning flag", () => {
    expect(
      getSnapshotFlagDetails({
        flakySnapshot,
        hasUncaughtPageError: true,
      }),
    ).toEqual([
      {
        flag: "flaky",
        detection: { sampleCount: 30, changeCount: 9, revertCount: 6, sameCommitMismatchCount: 1 },
        matchesEarlierVariant: false,
      },
      { flag: "warning" },
    ]);
  });
});
