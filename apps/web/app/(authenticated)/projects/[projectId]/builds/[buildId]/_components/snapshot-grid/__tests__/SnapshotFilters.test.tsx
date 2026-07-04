import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotFilters } from "../SnapshotFilters";

vi.mock("next/navigation");

const mockPush = vi.mocked(useRouter)().push;

describe("SnapshotFilters", () => {
  it("should show 'any' as the value for the status facet when no filter is applied", () => {
    render(<SnapshotFilters statuses={[]} />);

    expect(screen.getByRole("button", { name: /^status\s+any$/i })).toBeVisible();
  });

  it("should navigate with the selected statuses when the status facet is applied", async ({
    user,
  }) => {
    render(<SnapshotFilters statuses={[]} />);

    await user.click(screen.getByRole("button", { name: /^status\s+any$/i }));
    await user.click(await screen.findByRole("checkbox", { name: "queued" }));
    await user.click(await screen.findByRole("checkbox", { name: "error" }));
    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    expect(mockPush).toHaveBeenCalledWith("/?status=queued&status=error");
  });

  it("should mark the mobile filter menu button as active when a filter is applied", () => {
    render(<SnapshotFilters statuses={["queued"]} />);

    expect(screen.getByRole("button", { name: "filters (active)" })).toBeVisible();
  });

  it("should not mark the mobile filter menu button as active when no filter is applied", () => {
    render(<SnapshotFilters statuses={[]} />);

    expect(screen.getByRole("button", { name: "filters" })).toBeVisible();
  });
});
