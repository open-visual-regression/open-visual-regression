import { describe, expect, it, render, screen } from "@/test-utils";

import { UsersSearchField } from "../UsersSearchField";

describe("UsersSearchField", () => {
  it("should initialize the field from the search value", () => {
    render(<UsersSearchField search="ari" />);

    expect(screen.getByLabelText("Search users")).toHaveValue("ari");
  });

  it("should point the clear button back to the users page", () => {
    render(<UsersSearchField search="ari" />);

    expect(screen.getByRole("button", { name: "Clear search" })).toHaveAttribute(
      "href",
      "/settings/users",
    );
  });
});
