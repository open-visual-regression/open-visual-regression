import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";

import { BuildsFilters } from "../BuildsFilters";

vi.mock("next/navigation");

const mockPush = vi.mocked(useRouter)().push;

const renderComponent = () => render(<BuildsFilters status={[]} />);

describe("BuildsFilters", () => {
  it("should show 'any' as the status value when no filter is applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: /^status\s+any$/i })).toBeVisible();
  });

  it("should navigate with the selected statuses when the status facet is applied", async ({
    user,
  }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^status\s+any$/i }));
    await user.click(await screen.findByRole("checkbox", { name: "queued" }));
    await user.click(await screen.findByRole("checkbox", { name: "error" }));
    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    expect(mockPush).toHaveBeenCalledWith("/?status=queued&status=error");
  });

  it("should show a combined count once more than one option is selected", () => {
    render(<BuildsFilters status={["queued", "error"]} />);

    expect(screen.getByRole("button", { name: /^status\s+2 selected$/i })).toBeVisible();
  });

  it("should mark the mobile filter menu button as active when a filter is applied", () => {
    render(<BuildsFilters status={["queued"]} />);

    expect(screen.getByRole("button", { name: "filters (active)" })).toBeVisible();
  });

  it("should not mark the mobile filter menu button as active when no filter is applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: "filters" })).toBeVisible();
  });
});
