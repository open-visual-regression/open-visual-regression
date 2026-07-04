import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";

import { BuildsFilters } from "../BuildsFilters";

vi.mock("next/navigation");

const PROJECT_ID = "018f0000-0000-7000-8000-000000000000";

const mockPush = vi.mocked(useRouter)().push;

const renderComponent = () =>
  render(<BuildsFilters projectId={PROJECT_ID} statuses={[]} branches={[]} authors={[]} />);

describe("BuildsFilters", () => {
  it("should show 'any' as the value for every facet when no filter is applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: /^status\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^branch\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^author\s+any$/i })).toBeVisible();
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

  it("should reflect the applied branch on the branch facet trigger", () => {
    render(<BuildsFilters projectId={PROJECT_ID} statuses={[]} branches={["main"]} authors={[]} />);

    expect(screen.getByRole("button", { name: /^branch\s+main$/i })).toBeVisible();
  });

  it("should reflect the applied author on the author facet trigger", () => {
    render(
      <BuildsFilters projectId={PROJECT_ID} statuses={[]} branches={[]} authors={["Jordan Lee"]} />,
    );

    expect(screen.getByRole("button", { name: /^author\s+Jordan Lee$/i })).toBeVisible();
  });

  it("should mark the mobile filter menu button as active when a filter is applied", () => {
    render(
      <BuildsFilters projectId={PROJECT_ID} statuses={["queued"]} branches={[]} authors={[]} />,
    );

    expect(screen.getByRole("button", { name: "filters (active)" })).toBeVisible();
  });

  it("should not mark the mobile filter menu button as active when no filter is applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: "filters" })).toBeVisible();
  });
});
