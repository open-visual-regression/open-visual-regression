import { describe, expect, it } from "@/test-utils";

import { formatBuildTimingBreakdown } from "../buildTimings";

describe("formatBuildTimingBreakdown", () => {
  it("should list queue and processing time", () => {
    expect(formatBuildTimingBreakdown({ queuedMs: 12_000, processingMs: 122_000 })).toBe(
      "12s queued, 2m 2s processing",
    );
  });

  it("should leave out a build that never started processing", () => {
    expect(formatBuildTimingBreakdown({ queuedMs: 12_000, processingMs: null })).toBe("12s queued");
  });

  it("should be empty when there are no timings", () => {
    expect(formatBuildTimingBreakdown({ queuedMs: null, processingMs: null })).toBe("");
  });
});
