import { describe, expect, it, render, screen } from "@/test-utils";

import { ButtonLink } from "../ButtonLink";

describe("ButtonLink", () => {
  it("should render a link pointing at the href", () => {
    render(<ButtonLink href="/projects">view projects</ButtonLink>);

    expect(screen.getByRole("link", { name: "view projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("should forward the target and rel attributes to the link", () => {
    render(
      <ButtonLink href="https://example.com" target="_blank" rel="noopener noreferrer">
        external
      </ButtonLink>,
    );

    const link = screen.getByRole("link", { name: "external" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should render a disabled button when the href is null", () => {
    render(<ButtonLink href={null}>unavailable</ButtonLink>);

    expect(screen.queryByRole("link", { name: "unavailable" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "unavailable" })).toBeDisabled();
  });

  it("should render a disabled button when disabled even with an href", () => {
    render(
      <ButtonLink href="/projects" disabled>
        view projects
      </ButtonLink>,
    );

    expect(screen.queryByRole("link", { name: "view projects" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "view projects" })).toBeDisabled();
  });
});
