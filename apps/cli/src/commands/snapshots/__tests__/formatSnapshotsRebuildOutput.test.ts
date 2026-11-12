import { describe, expect, it } from "vitest";

import { formatSnapshotsRebuildOutput } from "../rebuild";

const BUILD_ID = "01a092d6-b0aa-71bf-9312-dd8ef48a22fb";

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
