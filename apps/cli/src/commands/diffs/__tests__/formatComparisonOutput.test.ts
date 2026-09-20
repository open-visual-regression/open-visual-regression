import { describe, expect, it } from "vitest";

import { formatComparisonOutput, type LocalComparison } from "../comparison";

const COMPARISON: LocalComparison = {
  width: 1280,
  height: 800,
  pixelDiffCount: 1234,
  diffPercent: 1.2345,
  diffPixels: new Uint8Array(),
  threshold: 0.05,
  diffImagePath: null,
};

describe("formatComparisonOutput", () => {
  it("should print the comparison and its verdict as JSON when json is true", () => {
    expect(JSON.parse(formatComparisonOutput(COMPARISON, true))).toEqual({
      width: 1280,
      height: 800,
      pixelDiffCount: 1234,
      diffPercent: 1.2345,
      threshold: 0.05,
      unchanged: false,
      diffImagePath: null,
    });
  });

  it("should leave the diff mask pixels out of the JSON", () => {
    expect(JSON.parse(formatComparisonOutput(COMPARISON, true))).not.toHaveProperty("diffPixels");
  });

  it("should report the compared size, counts and verdict", () => {
    const output = formatComparisonOutput(COMPARISON, false);

    expect(output).toContain("Compared:   1280x800");
    expect(output).toContain("Pixel diff: 1234");
    expect(output).toContain("Diff %:     1.23");
    expect(output).toContain("Threshold:  0.05");
    expect(output).toContain("Result:     needs review");
  });

  it("should report an unchanged verdict when within the threshold", () => {
    expect(formatComparisonOutput({ ...COMPARISON, diffPercent: 0 }, false)).toContain(
      "Result:     unchanged",
    );
  });

  it("should omit the diff image row when no mask was written", () => {
    expect(formatComparisonOutput(COMPARISON, false)).not.toContain("Diff image");
  });

  it("should report where the diff mask was written", () => {
    expect(formatComparisonOutput({ ...COMPARISON, diffImagePath: "./diff.png" }, false)).toContain(
      "Diff image: ./diff.png",
    );
  });
});
