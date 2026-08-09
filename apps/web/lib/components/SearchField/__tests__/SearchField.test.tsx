import { describe, expect, it, render, screen } from "@/test-utils";

import { SearchField } from "../SearchField";

describe("SearchField", () => {
  it("should render the input with the action's search param name", () => {
    render(<SearchField action="/users" label="search users" />);

    expect(screen.getByLabelText("search users")).toHaveAttribute("name", "search");
  });

  it("should initialize the field with the search value", () => {
    render(<SearchField action="/users" label="search users" search="ari" />);

    expect(screen.getByLabelText("search users")).toHaveValue("ari");
  });

  it("should not show a clear button when there is no search value", () => {
    render(<SearchField action="/users" label="search users" />);

    expect(screen.queryByRole("button", { name: "clear search" })).not.toBeInTheDocument();
  });

  it("should show a clear button linking back to the action when there is a search value", () => {
    render(<SearchField action="/users" label="search users" search="ari" />);

    expect(screen.getByRole("button", { name: "clear search" })).toHaveAttribute("href", "/users");
  });

  it("should preserve other query params on the clear button when clearing search", () => {
    render(
      <SearchField
        action="/users"
        label="search users"
        search="ari"
        searchParams={{ search: "ari", status: "needs_review" }}
      />,
    );

    expect(screen.getByRole("button", { name: "clear search" })).toHaveAttribute(
      "href",
      "/users?status=needs_review",
    );
  });

  it("should resubmit other query params as hidden fields when searching", () => {
    render(
      <SearchField
        action="/users"
        label="search users"
        search="ari"
        searchParams={{ search: "ari", status: ["needs_review", "error"] }}
      />,
    );

    const form = screen.getByRole("search");
    expect(form.querySelectorAll('input[type="hidden"][name="status"]')).toHaveLength(2);
    expect(
      Array.from(form.querySelectorAll('input[type="hidden"][name="status"]')).map(
        (input) => (input as HTMLInputElement).value,
      ),
    ).toEqual(["needs_review", "error"]);
  });
});
