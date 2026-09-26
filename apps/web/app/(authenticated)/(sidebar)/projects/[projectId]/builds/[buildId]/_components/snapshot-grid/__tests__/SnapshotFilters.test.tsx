import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";

import { type FacetOption } from "@/lib/components/facet/FacetOptionsList";
import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotFilters } from "../SnapshotFilters";

vi.mock("next/navigation");

const mockPush = vi.mocked(useRouter)().push;

const STATUS_OPTIONS: FacetOption<SnapshotDisplayStatus>[] = [
  { value: "queued", label: "queued" },
  { value: "error", label: "error" },
];

const BROWSER_OPTIONS: FacetOption<string>[] = [
  { value: "chromium", label: "chromium" },
  { value: "firefox", label: "firefox" },
];

const VIEWPORT_OPTIONS: FacetOption<string>[] = [
  { value: "desktop", label: "desktop" },
  { value: "mobile", label: "mobile" },
];

const renderComponent = () =>
  render(
    <SnapshotFilters
      statuses={[]}
      browsers={[]}
      viewports={[]}
      statusOptions={STATUS_OPTIONS}
      browserOptions={BROWSER_OPTIONS}
      viewportOptions={VIEWPORT_OPTIONS}
    />,
  );

describe("SnapshotFilters", () => {
  it("should show 'any' as the value for every facet when no filter is applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: /^status\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^browser\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^viewport\s+any$/i })).toBeVisible();
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

  it("should navigate with the selected viewports when the viewport facet is applied", async ({
    user,
  }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^viewport\s+any$/i }));
    await user.click(await screen.findByRole("checkbox", { name: "desktop" }));
    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    expect(mockPush).toHaveBeenCalledWith("/?viewport=desktop");
  });

  it("should reflect the applied browser on the browser facet trigger", () => {
    render(
      <SnapshotFilters
        statuses={[]}
        browsers={["chromium"]}
        viewports={[]}
        statusOptions={STATUS_OPTIONS}
        browserOptions={BROWSER_OPTIONS}
        viewportOptions={VIEWPORT_OPTIONS}
      />,
    );

    expect(screen.getByRole("button", { name: /^browser\s+chromium$/i })).toBeVisible();
  });

  it("should reflect the applied viewport on the viewport facet trigger", () => {
    render(
      <SnapshotFilters
        statuses={[]}
        browsers={[]}
        viewports={["mobile"]}
        statusOptions={STATUS_OPTIONS}
        browserOptions={BROWSER_OPTIONS}
        viewportOptions={VIEWPORT_OPTIONS}
      />,
    );

    expect(screen.getByRole("button", { name: /^viewport\s+mobile$/i })).toBeVisible();
  });

  it("should mark the mobile filter menu button as active when a filter is applied", () => {
    render(
      <SnapshotFilters
        statuses={["queued"]}
        browsers={[]}
        viewports={[]}
        statusOptions={STATUS_OPTIONS}
        browserOptions={BROWSER_OPTIONS}
        viewportOptions={VIEWPORT_OPTIONS}
      />,
    );

    expect(screen.getByRole("button", { name: "filters (active)" })).toBeVisible();
  });

  it("should not mark the mobile filter menu button as active when no filter is applied", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: "filters" })).toBeVisible();
  });

  it("should not render a facet that has one or zero options", () => {
    render(
      <SnapshotFilters
        statuses={[]}
        browsers={[]}
        viewports={[]}
        statusOptions={[{ value: "queued", label: "queued" }]}
        browserOptions={BROWSER_OPTIONS}
        viewportOptions={[]}
      />,
    );

    expect(screen.queryByRole("button", { name: /^status/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^viewport/i })).toBeNull();
    expect(screen.getByRole("button", { name: /^browser\s+any$/i })).toBeVisible();
  });

  it("should render nothing when no facet has more than one option", () => {
    render(
      <SnapshotFilters
        statuses={[]}
        browsers={[]}
        viewports={[]}
        statusOptions={[{ value: "queued", label: "queued" }]}
        browserOptions={[]}
        viewportOptions={[]}
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
  });
});
