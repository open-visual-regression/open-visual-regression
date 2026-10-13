import { describe, expect, it, render, screen } from "@/test-utils";

import { ForbiddenCard } from "../ForbiddenCard";

describe("ForbiddenCard", () => {
  it("should show who is signed in", () => {
    render(<ForbiddenCard reason="no-role" email="jane@example.com" />);

    expect(screen.getByText("signed in as jane@example.com")).toBeVisible();
  });

  it("should link to the access request page when access was not granted", () => {
    render(<ForbiddenCard reason="no-role" accessRequestUrl="https://opal.example.com/ovr" />);

    expect(screen.getByRole("link", { name: /request access/i })).toHaveAttribute(
      "href",
      "https://opal.example.com/ovr",
    );
  });

  it("should not offer to request access when an admin must confirm the account", () => {
    render(<ForbiddenCard reason="unconfirmed" accessRequestUrl="https://opal.example.com/ovr" />);

    expect(screen.getByText(/an admin must confirm it is yours/i)).toBeVisible();
    expect(screen.queryByRole("link", { name: /request access/i })).not.toBeInTheDocument();
  });
});
