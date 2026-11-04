import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServerClient } from "@/lib/orpc/server";
import { describe, expect, it, render, screen } from "@/test-utils";

import SnapshotsPage from "../page";

vi.mock("next/navigation");
vi.mock("@/lib/orpc/server");

const mockList = vi.mocked(orpcServerClient.snapshots.list);
const mockListStatuses = vi.mocked(orpcServerClient.snapshots.listStatuses);
const mockListBrowsers = vi.mocked(orpcServerClient.snapshots.listBrowsers);
const mockListViewports = vi.mocked(orpcServerClient.snapshots.listViewports);
const mockListFlags = vi.mocked(orpcServerClient.snapshots.listFlags);

const renderPage = async (searchParams: Record<string, string | string[]> = {}) =>
  render(
    await SnapshotsPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve(searchParams),
    }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
      ),
    },
  );

describe("SnapshotsPage", () => {
  beforeEach(() => {
    getQueryClient().clear();
    mockListStatuses.mockResolvedValue({ statuses: ["processing", "needs_review"] });
    mockListBrowsers.mockResolvedValue({ browsers: ["chromium", "firefox"] });
    mockListViewports.mockResolvedValue({ viewports: ["mobile", "desktop"] });
    mockListFlags.mockResolvedValue({ flags: ["flaky", "warning"] });
  });

  it("should list every project's snapshots alphabetically, each naming its project", async () => {
    mockList.mockResolvedValue({
      snapshots: [
        mocks.build.generateBuildSnapshot({
          project: { id: "018f0000-0000-7000-8000-000000000001", name: "Acme Web" },
          targetTitle: "Button",
          targetName: "Primary",
        }),
        mocks.build.generateBuildSnapshot({
          project: { id: "018f0000-0000-7000-8000-000000000002", name: "Acme Admin" },
          targetTitle: "Card",
          targetName: "Default",
        }),
      ],
      total: 2,
      nextCursor: null,
    });

    await renderPage();

    expect(screen.getByRole("heading", { name: "snapshots" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: /^snapshot of Button Primary, Acme Web,/ }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /^snapshot of Card Default, Acme Admin,/ }),
    ).toBeVisible();
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ buildId: undefined, sort: "name" }),
      expect.anything(),
    );
  });

  it("should say when there are no snapshots yet", async () => {
    mockList.mockResolvedValue({ snapshots: [], total: 0, nextCursor: null });

    await renderPage();

    expect(screen.getByText("no snapshots found")).toBeVisible();
  });

  it("should offer the status, browser, viewport and flags facets from every project", async () => {
    mockList.mockResolvedValue({ snapshots: [], total: 0, nextCursor: null });

    await renderPage();

    expect(screen.getByRole("button", { name: /^status\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^browser\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^viewport\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^flags\s+any$/i })).toBeVisible();
    expect(mockListStatuses).toHaveBeenCalledWith({}, expect.anything());
  });

  it("should apply the filters from the url to the snapshots query and the facet triggers", async () => {
    mockList.mockResolvedValue({ snapshots: [], total: 0, nextCursor: null });

    await renderPage({ status: "processing", flag: "flaky", search: "chart" });

    expect(screen.getByRole("button", { name: /^status\s+processing$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^flags\s+flaky$/i })).toBeVisible();
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: ["processing"], flags: ["flaky"], search: "chart" }),
      expect.anything(),
    );
  });

  it("should submit the search field back to the snapshots page", async () => {
    mockList.mockResolvedValue({ snapshots: [], total: 0, nextCursor: null });

    await renderPage();

    expect(screen.getByRole("search")).toHaveAttribute("action", "/snapshots");
  });
});
