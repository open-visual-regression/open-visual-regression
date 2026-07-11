import { describe, expect, it, render, screen } from "@/test-utils";

import { CardLink } from "../CardLink";

describe("CardLink", () => {
  it("should render a link pointing at the href", () => {
    render(<CardLink href="/projects/project-1">view project</CardLink>);

    expect(screen.getByRole("link", { name: "view project" })).toHaveAttribute(
      "href",
      "/projects/project-1",
    );
  });

  it("should apply the interactive hover and focus-visible styles", () => {
    render(<CardLink href="/projects/project-1">view project</CardLink>);

    const link = screen.getByRole("link", { name: "view project" });
    expect(link).toHaveClass("hover:scale-101");
    expect(link).toHaveClass("focus-visible:border-ovr-accent");
  });

  it("should merge a custom className with the base card styles", () => {
    render(
      <CardLink href="/projects/project-1" className="gap-0 py-0">
        view project
      </CardLink>,
    );

    const link = screen.getByRole("link", { name: "view project" });
    expect(link).toHaveClass("gap-0", "py-0", "rounded-card");
    expect(link).not.toHaveClass("gap-4", "py-4");
  });
});
