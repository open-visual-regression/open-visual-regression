import { describe, expect, it } from "vitest";

import type { DiffSchema } from "@ovr/api/contracts/diffs";

import { formatDiffDetail, formatDiffOutput } from "../detail";

const DIFF: DiffSchema = {
  id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
  processingStatus: "success",
  reviewStatus: "needs_review",
  diffImagePath: "project/builds/build/diffs/diff.png",
  pixelDiffCount: 1234,
  diffPercent: 1.2345,
  baselineSnapshot: null,
};

describe("formatDiffDetail", () => {
  it("should render the core fields as label: value lines", () => {
    const output = formatDiffDetail(DIFF);

    expect(output.split("\n")).toEqual([
      "Diff:       01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
      "Review:     needs_review",
      "Processing: success",
      "Pixel diff: 1234",
      "Diff %:     1.23",
      "Diff image: project/builds/build/diffs/diff.png",
    ]);
  });

  it("should print a dash for a pixel diff count that was never computed", () => {
    expect(formatDiffDetail({ ...DIFF, pixelDiffCount: null, diffPercent: null })).toContain(
      "Pixel diff: -",
    );
  });

  it("should omit the baseline rows when there is no baseline", () => {
    expect(formatDiffDetail(DIFF)).not.toContain("Baseline");
  });

  it("should include the baseline image when a baseline exists", () => {
    const output = formatDiffDetail({
      ...DIFF,
      baselineSnapshot: {
        imagePath: "project/builds/prior-build/snapshots/baseline.png",
        commitSha: null,
        commitUrl: null,
      },
    });

    expect(output).toContain("Baseline image: project/builds/prior-build/snapshots/baseline.png");
    expect(output).not.toContain("Baseline commit");
  });

  it("should include the baseline commit and its URL when both are known", () => {
    const output = formatDiffDetail({
      ...DIFF,
      baselineSnapshot: {
        imagePath: "project/builds/prior-build/snapshots/baseline.png",
        commitSha: "a1b2c3d",
        commitUrl: "https://github.com/example/repo/commit/a1b2c3d",
      },
    });

    expect(output).toContain("Baseline commit:     a1b2c3d");
    expect(output).toContain("Baseline commit URL: https://github.com/example/repo/commit/a1b2c3d");
  });
});

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
