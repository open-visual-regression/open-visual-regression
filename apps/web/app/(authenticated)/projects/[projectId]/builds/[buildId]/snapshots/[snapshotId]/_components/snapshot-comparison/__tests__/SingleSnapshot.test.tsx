import { describe, expect, it, render, screen } from "@/test-utils";
import { SingleSnapshot } from "../SingleSnapshot";

describe("SingleSnapshot", () => {
  it("should render only the given snapshot image", () => {
    render(<SingleSnapshot imagePath="new.png" alt="snapshot of Button" />);

    expect(screen.getByRole("img", { name: "snapshot of Button" })).toBeVisible();
  });
});
