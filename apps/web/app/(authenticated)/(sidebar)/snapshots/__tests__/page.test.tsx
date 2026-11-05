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

const renderPage = async () =>
  render(await SnapshotsPage(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
    ),
  });

describe("SnapshotsPage", () => {
  beforeEach(() => {
    getQueryClient().clear();
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
});
