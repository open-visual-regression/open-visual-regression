import { vi } from "vitest";
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";

import { describe, expect, it, render, screen } from "@/test-utils";
import { UsersSearchField } from "../UsersSearchField";

vi.mock("next/navigation");

const mockReplace = vi.mocked(useRouter)().replace;
const mockSearchParams = vi.mocked(useSearchParams);

describe("UsersSearchField", () => {
  it("should initialize the field from the search query param", () => {
    mockSearchParams.mockReturnValue(new ReadonlyURLSearchParams("search=ari"));

    render(<UsersSearchField />);

    expect(screen.getByLabelText("search users")).toHaveValue("ari");
  });

  it("should add the search query param when searching", async ({ user }) => {
    mockSearchParams.mockReturnValue(new ReadonlyURLSearchParams());

    render(<UsersSearchField />);

    await user.type(screen.getByLabelText("search users"), "ari");
    await user.click(screen.getByRole("button", { name: "search" }));

    expect(mockReplace).toHaveBeenCalledWith("/?search=ari", { scroll: false });
  });

  it("should remove the search query param when cleared", async ({ user }) => {
    mockSearchParams.mockReturnValue(new ReadonlyURLSearchParams("search=ari"));

    render(<UsersSearchField />);

    await user.click(screen.getByRole("button", { name: "clear search" }));

    expect(mockReplace).toHaveBeenCalledWith("/", { scroll: false });
  });
});
