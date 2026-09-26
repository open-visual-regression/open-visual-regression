import { describe, expect, it, render, screen } from "@/test-utils";

import { NoBuildsSection } from "../NoBuildsSection";

describe("NoBuildsSection", () => {
  it("should onboard the user with the cli command that uploads a first build", () => {
    render(<NoBuildsSection />);

    expect(screen.getByRole("heading", { name: "no builds yet" })).toBeVisible();
    expect(screen.getByText(/ovr snapshot storybook/)).toBeVisible();
  });
});
