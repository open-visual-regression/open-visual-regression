import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";

import { BuildsFilters } from "../BuildsFilters";

vi.mock("next/navigation");

const mockPush = vi.mocked(useRouter)().push;

const renderComponent = () =>
  render(
    <BuildsFilters
      status={[]}
      browser={[]}
      resolution={[]}
      resolutionOptions={[
        { viewportWidth: 1280, viewportHeight: 800 },
        { viewportWidth: 375, viewportHeight: 812 },
      ]}
    />,
  );

describe("BuildsFilters", () => {
  it("should show 'any' as the value for every facet when no filters are applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: /^status\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^browser\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^resolution\s+any$/i })).toBeVisible();
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

  it("should clear the browser filter", async ({ user }) => {
    render(
      <BuildsFilters
        status={[]}
        browser={["chromium"]}
        resolution={[]}
        resolutionOptions={[{ viewportWidth: 1280, viewportHeight: 800 }]}
      />,
    );

    expect(screen.getByRole("button", { name: /^browser\s+Chromium$/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^browser\s+Chromium$/i }));
    await user.click(screen.getByRole("button", { name: /^clear$/i }));

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("should show a combined count once more than one option is selected", () => {
    render(
      <BuildsFilters
        status={["queued", "error"]}
        browser={[]}
        resolution={[]}
        resolutionOptions={[]}
      />,
    );

    expect(screen.getByRole("button", { name: /^status\s+2 selected$/i })).toBeVisible();
  });

  it("should mark the mobile filter menu button as active when a filter is applied", () => {
    render(
      <BuildsFilters status={["queued"]} browser={[]} resolution={[]} resolutionOptions={[]} />,
    );

    expect(screen.getByRole("button", { name: "filters (active)" })).toBeVisible();
  });

  it("should not mark the mobile filter menu button as active when no filter is applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: "filters" })).toBeVisible();
  });
});
