import { describe, expect, it, render, screen } from "@/test-utils";
import { SplitPanes } from "../SplitPanes";

describe("SplitPanes", () => {
  it("should render the baseline and new snapshot panes", () => {
    render(
      <SplitPanes
        baselineImagePath="baseline.png"
        baselineAlt="baseline snapshot of Button"
        newImagePath="new.png"
        newAlt="snapshot of Button"
        diffImagePath="diff.png"
      />,
    );

    expect(screen.getByRole("img", { name: "baseline snapshot of Button" })).toBeVisible();
    expect(screen.getByRole("img", { name: "snapshot of Button" })).toBeVisible();
  });
});
