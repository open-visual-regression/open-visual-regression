import { describe, expect, it, render, screen } from "@/test-utils";
import { NewPane } from "../NewPane";

describe("NewPane", () => {
  it("should render the diff overlay when a diff image is present", () => {
    render(<NewPane imagePath="new.png" diffImagePath="diff.png" alt="snapshot of Button" />);

    expect(screen.getByRole("img", { name: "snapshot of Button" })).toBeVisible();
    expect(screen.getByRole("img", { name: "diff overlay of snapshot of Button" })).toBeVisible();
    expect(screen.getByRole("switch")).toBeVisible();
  });

  it("should render a plain snapshot with no diff controls when there is no diff image", () => {
    render(<NewPane imagePath="new.png" diffImagePath={null} alt="snapshot of Button" />);

    expect(screen.getByText("new")).toBeVisible();
    expect(screen.getByRole("img", { name: "snapshot of Button" })).toBeVisible();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
