import { describe, expect, it, render, screen } from "@/test-utils";
import { UsersSearchField } from "../UsersSearchField";

describe("UsersSearchField", () => {
  it("should initialize the field from the search value", () => {
    render(<UsersSearchField search="ari" />);

    expect(screen.getByLabelText("search users")).toHaveValue("ari");
  });

  it("should point the clear button back to the users page", () => {
    render(<UsersSearchField search="ari" />);

    expect(screen.getByRole("button", { name: "clear search" })).toHaveAttribute(
      "href",
      "/settings/users",
    );
  });
});
