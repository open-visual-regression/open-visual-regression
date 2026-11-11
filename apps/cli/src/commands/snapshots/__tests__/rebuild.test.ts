import { describe, expect, it } from "vitest";

import { formatSnapshotsRebuildOutput, selectRebuildableSnapshots, toBatches } from "../rebuild";

const BUILD_ID = "01a092d6-b0aa-71bf-9312-dd8ef48a22fb";

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

describe("toBatches", () => {
  it("should split items into batches no larger than the size", () => {
    expect(toBatches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("should return no batches for no items", () => {
    expect(toBatches([], 100)).toEqual([]);
  });
});

describe("formatSnapshotsRebuildOutput", () => {
  it("should say how many snapshots are rebuilding and how many were left out", () => {
    expect(
      formatSnapshotsRebuildOutput(
        { buildId: BUILD_ID, snapshotIds: ["a", "b"], leftOut: 1 },
        false,
      ),
    ).toBe(
      `Rebuilding 2 snapshots in build ${BUILD_ID}\nLeft out 1 that is queued, processing, or skipped.`,
    );
  });

  it("should say when nothing matched", () => {
    expect(
      formatSnapshotsRebuildOutput({ buildId: BUILD_ID, snapshotIds: [], leftOut: 0 }, false),
    ).toBe("No snapshots to rebuild.");
  });

  it("should print the build and snapshot ids as JSON when json is true", () => {
    expect(
      JSON.parse(
        formatSnapshotsRebuildOutput({ buildId: BUILD_ID, snapshotIds: ["a"], leftOut: 2 }, true),
      ),
    ).toEqual({ buildId: BUILD_ID, snapshotIds: ["a"] });
  });
});
