import { describe, expect, it } from "vitest";

import type { BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";

import { formatSnapshotsOutput } from "../table";

const SNAPSHOT: BuildSnapshotSchema = {
  id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
  targetId: "components-button--primary",
  targetTitle: "Components/Button",
  targetName: "Primary",
  status: "needs_review",
  imagePath: "project/builds/build/snapshots/snap.png",
  diffId: "01a092d6-b0aa-71bf-9312-dd8ef48a22fc",
  diffImagePath: "project/builds/build/diffs/diff.png",
  diffPercent: 1.2345,
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  viewportName: "desktop",
};

describe("formatSnapshotsOutput", () => {
  it("should print the snapshots, total and next cursor as JSON when json is true", () => {
    expect(
      formatSnapshotsOutput({ snapshots: [SNAPSHOT], total: 42, nextCursor: "abc" }, true),
    ).toBe(JSON.stringify({ snapshots: [SNAPSHOT], total: 42, nextCursor: "abc" }, null, 2));
  });

  it("should leave the applied filters out of the JSON", () => {
    const output = formatSnapshotsOutput(
      { snapshots: [], total: 0, nextCursor: null, filters: { status: ["error"] } },
      true,
    );

    expect(JSON.parse(output)).not.toHaveProperty("filters");
  });

  it("should print 'No snapshots found.' when there are no snapshots", () => {
    expect(formatSnapshotsOutput({ snapshots: [], total: 0, nextCursor: null }, false)).toBe(
      "No snapshots found.",
    );
  });

  it("should report the filters that produced an empty result", () => {
    expect(
      formatSnapshotsOutput(
        { snapshots: [], total: 0, nextCursor: null, filters: { browser: ["safari"] } },
        false,
      ),
    ).toBe("No snapshots found.\nFilters: browser=safari");
  });

  it("should print a row carrying the story, viewport and diff percentage", () => {
    const output = formatSnapshotsOutput(
      { snapshots: [SNAPSHOT], total: 1, nextCursor: null },
      false,
    );

    expect(output).toContain(SNAPSHOT.id);
    expect(output).toContain("Components/Button / Primary");
    expect(output).toContain("desktop 1280x800");
    expect(output).toContain("1.23");
  });

  it("should not invite a next page when there is no next cursor", () => {
    expect(
      formatSnapshotsOutput({ snapshots: [SNAPSHOT], total: 1, nextCursor: null }, false),
    ).not.toContain("--cursor");
  });

  it("should print the cursor for the next page when there is one", () => {
    expect(
      formatSnapshotsOutput({ snapshots: [SNAPSHOT], total: 42, nextCursor: "abc" }, false),
    ).toContain("Showing 1 of 42. Next page: --cursor abc");
  });

  it("should report a full page capture when a snapshot has no fixed viewport height", () => {
    const snapshot = { ...SNAPSHOT, viewportHeight: null };
    const output = formatSnapshotsOutput(
      { snapshots: [snapshot], total: 1, nextCursor: null },
      false,
    );

    expect(output).toContain("desktop 1280xfull");
  });

  it("should distinguish a snapshot never diffed from one diffed with no differences", () => {
    const undiffed = formatSnapshotsOutput(
      { snapshots: [{ ...SNAPSHOT, diffPercent: null }], total: 1, nextCursor: null },
      false,
    );
    const unchanged = formatSnapshotsOutput(
      { snapshots: [{ ...SNAPSHOT, diffPercent: 0 }], total: 1, nextCursor: null },
      false,
    );

    expect(undiffed.split("\n")[1]!.trimEnd()).toMatch(/-$/);
    expect(unchanged).toContain("0.00");
  });
});
