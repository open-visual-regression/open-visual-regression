import { describe, expect, it } from "vitest";

import type {
  GetHistoryOutputSchema,
  SnapshotHistoryEntrySchema,
} from "@ovr/api/contracts/snapshots";

import { countImageChanges, formatHistoryOutput, getImageLabels } from "../historyTable";

const IMAGE_A = "01a092d6-b0aa-71bf-9312-00000000000a";
const IMAGE_B = "01a092d6-b0aa-71bf-9312-00000000000b";

const entry = (
  id: string,
  variantId: string | null,
  overrides: Partial<SnapshotHistoryEntrySchema> = {},
): SnapshotHistoryEntrySchema => ({
  id: `01a092d6-b0aa-71bf-9312-${id.padStart(12, "0")}`,
  buildId: `01a092d6-b0aa-71bf-9312-${id.padStart(12, "1")}`,
  buildName: null,
  commitSha: "a1b2c3d4e5f6".padEnd(40, "0"),
  createdAt: "2026-10-01T10:00:00Z",
  status: "auto_approved",
  diffPercent: 1.5,
  variantId,
  ...overrides,
});

const HISTORY: GetHistoryOutputSchema = {
  branch: "main",
  snapshots: [entry("4", IMAGE_A), entry("3", IMAGE_B), entry("2", null), entry("1", IMAGE_A)],
};

describe("getImageLabels", () => {
  it("should label each distinct image in the order it first appeared", () => {
    expect(getImageLabels(HISTORY.snapshots)).toEqual(
      new Map([
        [IMAGE_A, "A"],
        [IMAGE_B, "B"],
      ]),
    );
  });

  it("should continue past Z with two-letter labels", () => {
    const snapshots = Array.from({ length: 28 }, (_, index) =>
      entry(String(index), `01a092d6-b0aa-71bf-9312-${String(index).padStart(12, "0")}`),
    );

    expect([...getImageLabels(snapshots).values()].slice(-3)).toEqual(["Z", "AA", "AB"]);
  });
});

describe("countImageChanges", () => {
  it("should count changes between consecutive known images", () => {
    expect(countImageChanges(HISTORY.snapshots)).toBe(2);
  });
});

describe("formatHistoryOutput", () => {
  it("should print the history as JSON when json is true", () => {
    expect(formatHistoryOutput(HISTORY, true)).toBe(JSON.stringify(HISTORY, null, 2));
  });

  it("should label each row's image and summarize the changes", () => {
    const lines = formatHistoryOutput(HISTORY, false).split("\n");

    expect(lines[0]).toContain("IMAGE");
    expect(lines[1]).toMatch(/a1b2c3d .* A$/);
    expect(lines[2]).toMatch(/ B$/);
    expect(lines[3]).toMatch(/ -$/);
    expect(lines.at(-1)).toBe(
      "Screenshot changed 2 times across the last 4 builds on main (2 distinct images).",
    );
  });

  it("should say when there are no snapshots like it on the branch", () => {
    expect(formatHistoryOutput({ branch: "main", snapshots: [] }, false)).toBe(
      "No snapshots like this one on main.",
    );
  });
});
