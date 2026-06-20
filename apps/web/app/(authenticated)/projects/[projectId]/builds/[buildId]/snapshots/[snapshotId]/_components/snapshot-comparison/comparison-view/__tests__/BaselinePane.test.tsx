import { describe, expect, it, render, screen } from "@/test-utils";
import { BaselinePane } from "../BaselinePane";

describe("BaselinePane", () => {
  it("should render the baseline label and image", () => {
    render(<BaselinePane imagePath="baseline.png" alt="baseline snapshot of Button" />);

    expect(screen.getByText("baseline")).toBeVisible();
    expect(screen.getByRole("img", { name: "baseline snapshot of Button" })).toBeVisible();
  });
});
