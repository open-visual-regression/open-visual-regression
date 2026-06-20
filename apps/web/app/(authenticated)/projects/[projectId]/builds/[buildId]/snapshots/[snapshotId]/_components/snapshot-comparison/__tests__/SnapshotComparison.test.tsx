import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { describe, expect, it, render, screen } from "@/test-utils";
import { SnapshotComparison } from "../SnapshotComparison";

const snapshot: SnapshotSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  targetName: "Kitchen Sink",
  targetTitle: "UI/Button",
  imagePath: "new.png",
  errorLogs: [],
};

const diff: DiffSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e3",
  processingStatus: "diffed",
  reviewStatus: "needs_review",
  diffImagePath: "diff.png",
  pixelDiffCount: 10,
  diffPercent: 1,
  baselineSnapshot: { imagePath: "baseline.png" },
};

describe("SnapshotComparison", () => {
  it.each([
    ["there is no diff", null],
    ["the diff has no baseline", { ...diff, baselineSnapshot: null }],
  ])(
    "should show only the new snapshot, with no baseline and no diff controls, when %s",
    (_description, diffInput) => {
      render(<SnapshotComparison snapshot={snapshot} diff={diffInput} />);

      expect(screen.getByRole("img", { name: "snapshot of UI/Button Kitchen Sink" })).toBeVisible();
      expect(screen.queryByText("baseline")).not.toBeInTheDocument();
      expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    },
  );

  it("should show the baseline alongside the new snapshot with a diff toggle when there is a visible diff", () => {
    render(<SnapshotComparison snapshot={snapshot} diff={diff} />);

    expect(
      screen.getByRole("img", { name: "baseline snapshot of UI/Button Kitchen Sink" }),
    ).toBeVisible();
    expect(screen.getByRole("img", { name: "snapshot of UI/Button Kitchen Sink" })).toBeVisible();
    expect(screen.getByRole("switch", { checked: true })).toBeVisible();
  });

  it("should show the baseline alongside the new snapshot with no diff toggle when there is a baseline but no visible diff", () => {
    render(<SnapshotComparison snapshot={snapshot} diff={{ ...diff, diffImagePath: null }} />);

    expect(
      screen.getByRole("img", { name: "baseline snapshot of UI/Button Kitchen Sink" }),
    ).toBeVisible();
    expect(screen.getByRole("img", { name: "snapshot of UI/Button Kitchen Sink" })).toBeVisible();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
