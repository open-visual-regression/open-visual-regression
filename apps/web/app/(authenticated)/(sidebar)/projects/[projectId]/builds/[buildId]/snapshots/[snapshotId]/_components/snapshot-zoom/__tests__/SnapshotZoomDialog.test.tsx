import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotZoomDialog } from "../SnapshotZoomDialog";

describe("SnapshotZoomDialog", () => {
  it("should open a zoom dialog with the image and zoom controls", async ({ user }) => {
    render(
      <SnapshotZoomDialog title="baseline" imagePath="baseline.png" alt="baseline snapshot" />,
    );

    await user.click(screen.getByRole("button", { name: "zoom baseline" }));

    expect(screen.getByRole("dialog", { name: "baseline" })).toBeVisible();
    expect(screen.getByRole("img", { name: "baseline snapshot" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "zoom in" })).toBeVisible();
    expect(screen.getByRole("button", { name: "zoom out" })).toBeVisible();
    expect(screen.getByRole("button", { name: "fit" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("100%");
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("should offer a diff toggle when a diff image is provided", async ({ user }) => {
    render(
      <SnapshotZoomDialog
        title="new"
        imagePath="new.png"
        alt="new snapshot"
        diffImagePath="diff.png"
      />,
    );

    await user.click(screen.getByRole("button", { name: "zoom new" }));

    expect(screen.getByRole("img", { name: "diff overlay of new snapshot" })).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("should disable the trigger when there is no image", () => {
    render(<SnapshotZoomDialog title="baseline" imagePath={null} alt="baseline snapshot" />);

    expect(screen.getByRole("button", { name: "zoom baseline" })).toBeDisabled();
  });

  it("should close the dialog from the toolbar", async ({ user }) => {
    render(
      <SnapshotZoomDialog title="baseline" imagePath="baseline.png" alt="baseline snapshot" />,
    );

    await user.click(screen.getByRole("button", { name: "zoom baseline" }));
    await user.click(screen.getByRole("button", { name: "close" }));

    expect(screen.queryByRole("dialog", { name: "baseline" })).not.toBeInTheDocument();
  });
});
