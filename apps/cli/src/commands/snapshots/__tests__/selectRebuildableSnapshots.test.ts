import { describe, expect, it } from "vitest";

import { selectRebuildableSnapshots } from "../rebuild";

describe("selectRebuildableSnapshots", () => {
  it("should leave out snapshots that are still being captured or are skipped", () => {
    expect(
      selectRebuildableSnapshots([
        { id: "a", status: "error" },
        { id: "b", status: "queued" },
        { id: "c", status: "processing" },
        { id: "d", status: "skipped" },
        { id: "e", status: "needs_review" },
      ]),
    ).toEqual({ snapshotIds: ["a", "e"], leftOut: 3 });
  });
});
