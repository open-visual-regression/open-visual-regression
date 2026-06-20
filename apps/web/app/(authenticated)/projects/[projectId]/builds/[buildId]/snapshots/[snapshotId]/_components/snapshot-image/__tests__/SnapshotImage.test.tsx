import { describe, expect, it, render, screen } from "@/test-utils";
import { SnapshotImage } from "../SnapshotImage";

describe("SnapshotImage", () => {
  it("should render the image when an image path is given", () => {
    render(<SnapshotImage imagePath="snapshot.png" alt="snapshot of Button" />);

    expect(screen.getByRole("img", { name: "snapshot of Button" })).toBeVisible();
  });

  it("should show a placeholder when there is no image path", () => {
    render(<SnapshotImage imagePath={null} alt="snapshot of Button" />);

    expect(screen.getByText("no preview")).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
