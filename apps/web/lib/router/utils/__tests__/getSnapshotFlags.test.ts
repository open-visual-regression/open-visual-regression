import { describe, expect, it } from "@/test-utils";

import { getSnapshotFlags } from "../snapshotFlags";

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
