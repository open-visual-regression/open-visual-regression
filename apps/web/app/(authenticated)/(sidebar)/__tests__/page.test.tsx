import { describe, expect, it, render, screen } from "@/test-utils";

import OverviewPage from "../page";

describe("OverviewPage", () => {
  it.each([
    ["projects", "/projects"],
    ["builds", "/builds"],
    ["snapshots", "/snapshots"],
  ])("should link to the %s page", (name, href) => {
    render(<OverviewPage />);

    expect(screen.getByRole("heading", { name: "overview" })).toBeVisible();
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
  });
});
