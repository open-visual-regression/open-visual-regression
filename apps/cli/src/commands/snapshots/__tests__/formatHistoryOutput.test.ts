import { describe, expect, it } from "vitest";

import type {
  GetHistoryOutputSchema,
  SnapshotHistoryEntrySchema,
} from "@ovr/api/contracts/snapshots";

import { countLookChanges, formatHistoryOutput, getLookLabels } from "../historyTable";

const LOOK_A = "01a092d6-b0aa-71bf-9312-00000000000a";
const LOOK_B = "01a092d6-b0aa-71bf-9312-00000000000b";

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
  snapshots: [entry("4", LOOK_A), entry("3", LOOK_B), entry("2", null), entry("1", LOOK_A)],
};

describe("getLookLabels", () => {
  it("should label each distinct look in the order it first appeared", () => {
    expect(getLookLabels(HISTORY.snapshots)).toEqual(
      new Map([
        [LOOK_A, "A"],
        [LOOK_B, "B"],
      ]),
    );
  });

  it("should continue past Z with two-letter labels", () => {
    const snapshots = Array.from({ length: 28 }, (_, index) =>
      entry(String(index), `01a092d6-b0aa-71bf-9312-${String(index).padStart(12, "0")}`),
    );

    expect([...getLookLabels(snapshots).values()].slice(-3)).toEqual(["Z", "AA", "AB"]);
  });
});

describe("countLookChanges", () => {
  it("should count changes between consecutive known looks", () => {
    expect(countLookChanges(HISTORY.snapshots)).toBe(2);
  });
});

describe("formatHistoryOutput", () => {
  it("should print the history as JSON when json is true", () => {
    expect(formatHistoryOutput(HISTORY, true)).toBe(JSON.stringify(HISTORY, null, 2));
  });

  it("should label each row's look and summarize the changes", () => {
    const lines = formatHistoryOutput(HISTORY, false).split("\n");

    expect(lines[0]).toContain("LOOK");
    expect(lines[1]).toMatch(/a1b2c3d .* A$/);
    expect(lines[2]).toMatch(/ B$/);
    expect(lines[3]).toMatch(/ -$/);
    expect(lines.at(-1)).toBe(
      "Screenshot changed 2 times across the last 4 builds on main (2 different looks).",
    );
  });

  it("should say when there are no snapshots like it on the branch", () => {
    expect(formatHistoryOutput({ branch: "main", snapshots: [] }, false)).toBe(
      "No snapshots like this one on main.",
    );
  });
});
