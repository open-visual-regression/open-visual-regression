import type { FlakySnapshotDbSchema } from "@ovr/db/repository/flakySnapshots";

import { describe, expect, it } from "@/test-utils";

import { getSnapshotFlagDetails, getSnapshotFlags } from "../snapshotFlags";

const flakySnapshot = {
  sampleCount: 30,
  changeCount: 9,
  revertCount: 6,
  sameCommitMismatchCount: 1,
} as FlakySnapshotDbSchema;

describe("getSnapshotFlags", () => {
  it.each([
    [false, false, []],
    [true, false, ["flaky"]],
    [false, true, ["warning"]],
    [true, true, ["flaky", "warning"]],
  ])(
    "should flag isFlaky=%s hasUncaughtPageError=%s as %j",
    (isFlaky, hasUncaughtPageError, expected) => {
      expect(getSnapshotFlags({ isFlaky, hasUncaughtPageError })).toEqual(expected);
    },
  );
});

describe("getSnapshotFlagDetails", () => {
  it("should return no flags for a snapshot that is neither flaky nor warned", () => {
    expect(
      getSnapshotFlagDetails({
        flakySnapshot: undefined,
        matchesEarlierVariant: false,
        hasUncaughtPageError: false,
      }),
    ).toEqual([]);
  });

  it("should include the flaky history of a flagged story", () => {
    expect(
      getSnapshotFlagDetails({
        flakySnapshot,
        matchesEarlierVariant: false,
        hasUncaughtPageError: false,
      }),
    ).toEqual([
      {
        flag: "flaky",
        history: { sampleCount: 30, changeCount: 9, revertCount: 6, sameCommitMismatchCount: 1 },
        matchesEarlierVariant: false,
      },
    ]);
  });

  it("should flag a change that matches an earlier variant even without flaky history", () => {
    expect(
      getSnapshotFlagDetails({
        flakySnapshot: undefined,
        matchesEarlierVariant: true,
        hasUncaughtPageError: true,
      }),
    ).toEqual([{ flag: "flaky", history: null, matchesEarlierVariant: true }, { flag: "warning" }]);
  });
});
