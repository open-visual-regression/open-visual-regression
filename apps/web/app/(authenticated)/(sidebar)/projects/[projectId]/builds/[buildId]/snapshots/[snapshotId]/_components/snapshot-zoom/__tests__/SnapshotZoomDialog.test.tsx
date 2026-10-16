import { describe, expect, it, render, screen } from "@/test-utils";

import { ComparisonModeProvider } from "../../snapshot-comparison-section/comparison-view/comparison-mode";
import { SnapshotZoomDialog, type SnapshotZoomDialogProps } from "../SnapshotZoomDialog";
import { SnapshotZoomTrigger } from "../SnapshotZoomTrigger";

const props: Omit<SnapshotZoomDialogProps, "children"> = {
  baseline: {
    imagePath: "baseline.png",
    alt: "baseline snapshot",
    commitSha: "abc1234567890",
    commitUrl: null,
  },
  newSnapshot: { imagePath: "new.png", alt: "new snapshot" },
  diffImagePath: "diff.png",
};

const renderDialog = (overrides: Partial<typeof props> = {}) =>
  render(
    <ComparisonModeProvider>
      <SnapshotZoomDialog {...props} {...overrides}>
        <SnapshotZoomTrigger view="baseline" />
        <SnapshotZoomTrigger view="new" />
      </SnapshotZoomDialog>
    </ComparisonModeProvider>,
  );

describe("SnapshotZoomDialog", () => {
  it("should open the baseline with zoom controls when the baseline is clicked", async ({
    user,
  }) => {
    renderDialog();

    await user.click(screen.getByRole("button", { name: "zoom baseline" }));

    expect(screen.getByRole("dialog", { name: "baseline" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "baseline" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("img", { name: "baseline snapshot" })).toBeInTheDocument();
    expect(screen.getByText("abc1234")).toBeVisible();
    expect(screen.getByRole("button", { name: "zoom in" })).toBeVisible();
    expect(screen.getByRole("button", { name: "zoom out" })).toBeVisible();
    expect(screen.getByRole("button", { name: "fit" })).toBeVisible();
    expect(screen.getByText("100%", { selector: "[role=status]" })).toBeVisible();
  });

  it("should open the new snapshot with its diff when the new snapshot is clicked", async ({
    user,
  }) => {
    renderDialog();

    await user.click(screen.getByRole("button", { name: "zoom new" }));

    expect(screen.getByRole("dialog", { name: "new" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "new" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("img", { name: "diff overlay of new snapshot" })).toHaveClass(
      "opacity-100",
    );
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("should toggle between the baseline and the new snapshot", async ({ user }) => {
    renderDialog();

    await user.click(screen.getByRole("button", { name: "zoom new" }));
    await user.click(screen.getByRole("tab", { name: "baseline" }));

    expect(screen.getByRole("dialog", { name: "baseline" })).toBeVisible();
    expect(screen.getByRole("img", { name: "new snapshot" })).toHaveClass("invisible");
    expect(screen.getByRole("img", { name: "diff overlay of new snapshot" })).toHaveClass(
      "opacity-0",
    );
    expect(screen.getByRole("switch")).toHaveAttribute("data-disabled");

    await user.click(screen.getByRole("tab", { name: "new" }));

    expect(screen.getByRole("dialog", { name: "new" })).toBeVisible();
    expect(screen.getByRole("img", { name: "baseline snapshot" })).toHaveClass("invisible");
    expect(screen.getByRole("img", { name: "diff overlay of new snapshot" })).toHaveClass(
      "opacity-100",
    );
  });

  it("should hide the diff overlay when the diff is switched off", async ({ user }) => {
    renderDialog();

    await user.click(screen.getByRole("button", { name: "zoom new" }));
    await user.click(screen.getByRole("switch"));

    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(screen.getByRole("img", { name: "diff overlay of new snapshot" })).toHaveClass(
      "opacity-0",
    );
  });

  it("should only show the new snapshot when there is no baseline", async ({ user }) => {
    renderDialog({ baseline: null, diffImagePath: null });

    await user.click(screen.getByRole("button", { name: "zoom new" }));

    expect(screen.getByRole("dialog", { name: "new" })).toBeVisible();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "baseline snapshot" })).not.toBeInTheDocument();
  });

  it("should close the dialog from the toolbar", async ({ user }) => {
    renderDialog();

    await user.click(screen.getByRole("button", { name: "zoom baseline" }));
    await user.click(screen.getByRole("button", { name: "close" }));

    expect(screen.queryByRole("dialog", { name: "baseline" })).not.toBeInTheDocument();
  });
});
