import { describe, expect, it } from "vitest";

import type { DiffSchema } from "@ovr/api/contracts/diffs";

import { formatDiffOutput } from "../detail";

const DIFF: DiffSchema = {
  id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
  processingStatus: "success",
  reviewStatus: "needs_review",
  diffImagePath: "project/builds/build/diffs/diff.png",
  pixelDiffCount: 1234,
  diffPercent: 1.2345,
  baselineSnapshot: null,
};

describe("formatDiffOutput", () => {
  it("should print the raw diff as JSON when json is true", () => {
    expect(formatDiffOutput(DIFF, true)).toBe(JSON.stringify(DIFF, null, 2));
  });

  it("should print null as JSON when there is no diff and json is true", () => {
    expect(formatDiffOutput(null, true)).toBe("null");
  });

  it("should print formatted detail text when json is false", () => {
    expect(formatDiffOutput(DIFF, false)).toContain(DIFF.id);
  });

  it("should report there is no diff when json is false and the diff is null", () => {
    expect(formatDiffOutput(null, false)).toBe("No diff for this snapshot.");
  });
});
