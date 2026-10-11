import { describe, expect, it } from "vitest";

import { isCaptureReportPassing } from "../report";
import type { CaptureResult } from "../run";

const RESULT: CaptureResult = {
  targetId: "components-button--primary",
  browser: "chromium",
  viewportName: "desktop",
  runs: 3,
  diffThreshold: 0.05,
  images: [{ hash: "aaaaaaaaaaaa", count: 3, diffPercent: 0, file: null }],
  errors: [],
};

const UNSTABLE: CaptureResult = {
  ...RESULT,
  images: [
    { hash: "aaaaaaaaaaaa", count: 2, diffPercent: 0, file: "out/a.png" },
    { hash: "bbbbbbbbbbbb", count: 1, diffPercent: 1.5, file: "out/b.png" },
  ],
};

describe("isCaptureReportPassing", () => {
  it("should pass only when every capture was stable and nothing failed", () => {
    expect(isCaptureReportPassing({ results: [RESULT], issues: [] })).toBe(true);
    expect(isCaptureReportPassing({ results: [RESULT, UNSTABLE], issues: [] })).toBe(false);
    expect(
      isCaptureReportPassing({
        results: [RESULT],
        issues: [{ targetId: "x", message: "failed to load: boom" }],
      }),
    ).toBe(false);
  });
});
