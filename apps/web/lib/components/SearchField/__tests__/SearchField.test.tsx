import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";
import { SearchField, type SearchFieldProps } from "../SearchField";

describe("SearchField", () => {
  type RenderComponentOptions = Partial<SearchFieldProps>;

  const renderComponent = ({
    label = "search users",
    onSearchAction = vi.fn(),
    ...props
  }: RenderComponentOptions = {}) => {
    render(<SearchField {...props} label={label} onSearchAction={onSearchAction} />);

    return { onSearchAction };
  };

  it("should search when the search button is clicked", async ({ user }) => {
    const { onSearchAction } = renderComponent();

    await user.type(screen.getByLabelText("search users"), "ari");
    await user.click(screen.getByRole("button", { name: "search" }));

    expect(onSearchAction).toHaveBeenCalledWith("ari");
  });

  it("should trim whitespace from the search term", async ({ user }) => {
    const { onSearchAction } = renderComponent();

    await user.type(screen.getByLabelText("search users"), "  ari  ");
    await user.click(screen.getByRole("button", { name: "search" }));

    expect(onSearchAction).toHaveBeenCalledWith("ari");
  });

  it("should initialize the field with the default value", () => {
    renderComponent({ defaultValue: "ari" });

    expect(screen.getByLabelText("search users")).toHaveValue("ari");
  });

  it("should not show a clear button when the field is empty", () => {
    renderComponent();

    expect(screen.queryByRole("button", { name: "clear search" })).not.toBeInTheDocument();
  });

  it("should clear the search term when the clear button is clicked", async ({ user }) => {
    const { onSearchAction } = renderComponent({ defaultValue: "ari" });

    await user.click(screen.getByRole("button", { name: "clear search" }));

    expect(screen.getByLabelText("search users")).toHaveValue("");
    expect(onSearchAction).toHaveBeenCalledWith("");
  });

  it("should disable the input and buttons while loading", () => {
    renderComponent({ defaultValue: "ari", loading: true });

    expect(screen.getByLabelText("search users")).toBeDisabled();
    expect(screen.getByRole("button", { name: "search" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "clear search" })).toBeDisabled();
  });
});
