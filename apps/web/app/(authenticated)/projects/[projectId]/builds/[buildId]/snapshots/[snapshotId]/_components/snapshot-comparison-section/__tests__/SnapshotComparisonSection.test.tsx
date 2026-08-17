import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { describe, expect, it, render, screen } from "@/test-utils";

import { ComparisonModeProvider } from "../comparison-view/comparison-mode";
import { SnapshotComparisonSection } from "../SnapshotComparisonSection";

const snapshot: SnapshotSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  viewportName: "desktop",
  targetId: "ui-button--primary",
  targetName: "Kitchen Sink",
  targetTitle: "UI/Button",
  imagePath: "new.png",
  status: "unchanged",
  errorLogs: [],
};

const diff: DiffSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e3",
  processingStatus: "success",
  reviewStatus: "needs_review",
  diffImagePath: "diff.png",
  pixelDiffCount: 10,
  diffPercent: 1,
  baselineSnapshot: { imagePath: "baseline.png", commitSha: null, commitUrl: null },
};

const renderSection = (diffInput: DiffSchema | null) =>
  render(
    <ComparisonModeProvider>
      <SnapshotComparisonSection snapshot={snapshot} diff={diffInput} />
    </ComparisonModeProvider>,
  );

describe("SnapshotComparisonSection", () => {
  it.each([
    ["there is no diff", null],
    ["the diff has no baseline", { ...diff, baselineSnapshot: null }],
  ])("should show only the new snapshot, with no baseline, when %s", (_description, diffInput) => {
    renderSection(diffInput);

    expect(screen.getByRole("img", { name: "snapshot of UI/Button Kitchen Sink" })).toBeVisible();
    expect(screen.queryByText("baseline")).not.toBeInTheDocument();
  });

  it("should show the baseline, the new snapshot, and the diff overlay when there is a visible diff", () => {
    renderSection(diff);

    expect(
      screen.getByRole("img", { name: "baseline snapshot of UI/Button Kitchen Sink" }),
    ).toBeVisible();
    expect(screen.getByRole("img", { name: "snapshot of UI/Button Kitchen Sink" })).toBeVisible();
    expect(
      screen.getByRole("img", { name: "diff overlay of snapshot of UI/Button Kitchen Sink" }),
    ).toBeVisible();
  });

  it("should show the baseline and new snapshot without a diff overlay when there is no visible diff", () => {
    renderSection({ ...diff, diffImagePath: null });

    expect(
      screen.getByRole("img", { name: "baseline snapshot of UI/Button Kitchen Sink" }),
    ).toBeVisible();
    expect(screen.getByRole("img", { name: "snapshot of UI/Button Kitchen Sink" })).toBeVisible();
    expect(
      screen.queryByRole("img", { name: "diff overlay of snapshot of UI/Button Kitchen Sink" }),
    ).not.toBeInTheDocument();
  });
});
