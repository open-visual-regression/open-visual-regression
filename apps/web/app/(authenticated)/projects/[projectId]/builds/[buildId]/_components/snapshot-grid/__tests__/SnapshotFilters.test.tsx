import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotFilters } from "../SnapshotFilters";

vi.mock("next/navigation");

const mockPush = vi.mocked(useRouter)().push;

const renderComponent = () => render(<SnapshotFilters statuses={[]} browsers={[]} />);

describe("SnapshotFilters", () => {
  it("should show 'any' as the value for every facet when no filter is applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: /^status\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^browser\s+any$/i })).toBeVisible();
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

  it("should navigate with the selected browsers when the browser facet is applied", async ({
    user,
  }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^browser\s+any$/i }));
    await user.click(await screen.findByRole("checkbox", { name: "chromium" }));
    await user.click(await screen.findByRole("checkbox", { name: "firefox" }));
    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    expect(mockPush).toHaveBeenCalledWith("/?browser=chromium&browser=firefox");
  });

  it("should reflect the applied browser on the browser facet trigger", () => {
    render(<SnapshotFilters statuses={[]} browsers={["webkit"]} />);

    expect(screen.getByRole("button", { name: /^browser\s+webkit$/i })).toBeVisible();
  });

  it("should mark the mobile filter menu button as active when a filter is applied", () => {
    render(<SnapshotFilters statuses={["queued"]} browsers={[]} />);

    expect(screen.getByRole("button", { name: "filters (active)" })).toBeVisible();
  });

  it("should not mark the mobile filter menu button as active when no filter is applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: "filters" })).toBeVisible();
  });
});
