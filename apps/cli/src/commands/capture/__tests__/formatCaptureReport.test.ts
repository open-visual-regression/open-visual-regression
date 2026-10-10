import { describe, expect, it } from "vitest";

import { formatCaptureReport, isCaptureReportPassing, type CaptureReport } from "../report";
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
  targetId: "components-dialog--open",
  images: [
    { hash: "aaaaaaaaaaaa", count: 2, diffPercent: 0, file: "out/a.png" },
    { hash: "bbbbbbbbbbbb", count: 1, diffPercent: 1.5, file: "out/b.png" },
  ],
};

describe("formatCaptureReport", () => {
  it("should print the report as JSON when json is true", () => {
    const report: CaptureReport = { results: [RESULT], issues: [] };

    expect(formatCaptureReport(report, true)).toBe(JSON.stringify(report, null, 2));
  });

  it("should list each capture with its result and summarize", () => {
    const lines = formatCaptureReport({ results: [RESULT, UNSTABLE], issues: [] }, false).split(
      "\n",
    );

    expect(lines[0]).toContain("RESULT");
    expect(lines[1]).toMatch(/components-button--primary .* stable$/);
    expect(lines[2]).toMatch(/components-dialog--open .* unstable$/);
    expect(lines[2]).toContain("1.50");
    expect(lines).toContain("components-dialog--open (desktop): 2x, 0.00% different: out/a.png");
    expect(lines).toContain("components-dialog--open (desktop): 1x, 1.50% different: out/b.png");
    expect(lines.at(-1)).toBe("1 of 2 captures stayed within their diff threshold on every run.");
  });

  it("should treat differences within the diff threshold as stable", () => {
    const withinThreshold: CaptureResult = {
      ...UNSTABLE,
      images: [
        { hash: "aaaaaaaaaaaa", count: 2, diffPercent: 0, file: "out/a.png" },
        { hash: "bbbbbbbbbbbb", count: 1, diffPercent: 0.002, file: "out/b.png" },
      ],
    };

    const lines = formatCaptureReport({ results: [withinThreshold], issues: [] }, false).split(
      "\n",
    );

    expect(lines[1]).toMatch(/ 2 +0\.00 +stable$/);
    expect(lines).not.toContain(
      "components-dialog--open (desktop): 1x, 0.00% different: out/b.png",
    );
  });

  it("should report render errors and targets that could not be captured", () => {
    const output = formatCaptureReport(
      {
        results: [{ ...RESULT, errors: ["play function failed"] }],
        issues: [{ targetId: "components-card--broken", message: "failed to load: boom" }],
      },
      false,
    );

    expect(output).toContain("components-button--primary (desktop): play function failed");
    expect(output).toContain("components-card--broken: failed to load: boom");
  });
});

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
