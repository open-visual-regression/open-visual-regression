import { describe, expect, it } from "vitest";

import type { SnapshotHistoryEntrySchema } from "@ovr/api/contracts/snapshots";

import { getImageLabels } from "../historyTable";

const variantId = (index: number) => `01a092d6-b0aa-71bf-9312-${String(index).padStart(12, "0")}`;

const entry = (variantId: string | null): SnapshotHistoryEntrySchema => ({
  id: "01a092d6-b0aa-71bf-9312-000000000001",
  buildId: "01a092d6-b0aa-71bf-9312-000000000002",
  buildName: null,
  commitSha: "a1b2c3d4e5f6".padEnd(40, "0"),
  createdAt: "2026-10-01T10:00:00Z",
  status: "auto_approved",
  diffPercent: 1.5,
  variantId,
});

describe("getImageLabels", () => {
  it("should label each distinct image in the order it first appeared", () => {
    const labels = getImageLabels([
      entry(variantId(1)),
      entry(variantId(2)),
      entry(null),
      entry(variantId(1)),
    ]);

    expect(labels).toEqual(
      new Map([
        [variantId(1), "A"],
        [variantId(2), "B"],
      ]),
    );
  });

  it("should continue past Z with two-letter labels", () => {
    const snapshots = Array.from({ length: 28 }, (_, index) => entry(variantId(index)));

    expect([...getImageLabels(snapshots).values()].slice(-3)).toEqual(["Z", "AA", "AB"]);
  });
});
