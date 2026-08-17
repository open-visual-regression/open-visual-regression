import { describe, expect, it, render, screen } from "@/test-utils";

import { ComparisonModeProvider } from "../comparison-mode";
import { ComparisonControls } from "../ComparisonControls";
import { ComparisonView, type ComparisonViewProps } from "../ComparisonView";

const props: ComparisonViewProps = {
  baselineImagePath: "baseline.png",
  baselineAlt: "baseline snapshot",
  baselineCommitSha: null,
  baselineCommitUrl: null,
  newImagePath: "new.png",
  newAlt: "new snapshot",
  diffImagePath: "diff.png",
};

const renderComparison = (overrides: Partial<typeof props> = {}, hasDiff = true) =>
  render(
    <ComparisonModeProvider>
      <ComparisonControls hasDiff={hasDiff} />
      <ComparisonView {...props} {...overrides} />
    </ComparisonModeProvider>,
  );

describe("ComparisonView", () => {
  it("should default to split view with both snapshots and the diff toggle visible", () => {
    renderComparison();

    expect(screen.getByRole("tab", { name: "split" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("img", { name: "baseline snapshot" })).toBeVisible();
    expect(screen.getByRole("img", { name: "new snapshot" })).toBeVisible();
    expect(screen.getByRole("switch")).toBeVisible();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("should switch to a unified slider without a diff toggle when slider view is selected", async ({
    user,
  }) => {
    renderComparison();

    await user.click(screen.getByRole("tab", { name: "slider" }));

    expect(screen.getByRole("slider")).toBeVisible();
    expect(screen.getByRole("img", { name: "baseline snapshot" })).toBeVisible();
    expect(screen.getByRole("img", { name: "new snapshot" })).toBeVisible();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("should restore the split view and its diff toggle when switching back", async ({ user }) => {
    renderComparison();

    await user.click(screen.getByRole("tab", { name: "slider" }));
    await user.click(screen.getByRole("tab", { name: "split" }));

    expect(screen.getByRole("switch")).toBeVisible();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("should not show the diff toggle in split view when there is no diff image", () => {
    renderComparison({ diffImagePath: null }, false);

    expect(screen.getByRole("tab", { name: "split" })).toBeVisible();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("should still offer the slider view when there is a baseline but no diff image", async ({
    user,
  }) => {
    renderComparison({ diffImagePath: null }, false);

    await user.click(screen.getByRole("tab", { name: "slider" }));

    expect(screen.getByRole("slider")).toBeVisible();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
