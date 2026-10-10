import { describe, expect, it } from "vitest";

import type { DiffAnalysis } from "@ovr/diff-analysis/analyzeDiff";

import { formatDiffAnalysis } from "../analysis";

const ANALYSIS: DiffAnalysis = {
  changedPixelCount: 15169,
  changedRegion: { x: 347, y: 61, width: 337, height: 718 },
  shift: { x: -19, y: 0, explainedPercent: 100 },
  sizeChange: null,
};

describe("formatDiffAnalysis", () => {
  it("should describe content that moved", () => {
    expect(formatDiffAnalysis(ANALYSIS)).toBe(
      "Analysis:\n  15169 pixels changed within 337x718 at 347,61\n  Content moved 19px left (explains 100% of the change)",
    );
  });

  it("should describe movement on both axes", () => {
    expect(
      formatDiffAnalysis({ ...ANALYSIS, shift: { x: 4, y: -2, explainedPercent: 80 } }),
    ).toContain("Content moved 4px right and 2px up (explains 80% of the change)");
  });

  it("should say when the change isn't explained by movement", () => {
    expect(formatDiffAnalysis({ ...ANALYSIS, shift: null })).toContain(
      "The change isn't explained by content moving",
    );
  });

  it("should report a size change and no changed pixels", () => {
    expect(
      formatDiffAnalysis({
        changedPixelCount: 0,
        changedRegion: null,
        shift: null,
        sizeChange: { from: { width: 1280, height: 800 }, to: { width: 1280, height: 900 } },
      }),
    ).toBe("Analysis:\n  Size changed from 1280x800 to 1280x900\n  No pixels changed");
  });
});
