import { describe, expect, it, render, screen } from "@/test-utils";

import { ExternalLink } from "../ExternalLink";

describe("ExternalLink", () => {
  it("should render a link pointing at the href", () => {
    render(<ExternalLink href="https://github.com/acme/web/commit/abc123">abc123</ExternalLink>);

    expect(screen.getByRole("link", { name: /abc123/ })).toHaveAttribute(
      "href",
      "https://github.com/acme/web/commit/abc123",
    );
  });

  it("should open in a new tab without leaking a referrer or window handle", () => {
    render(<ExternalLink href="https://example.com">external</ExternalLink>);

    const link = screen.getByRole("link", { name: /external/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
