import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { getQueryClient } from "@/lib/orpc/query-client";
import { describe, expect, it, render, screen } from "@/test-utils";

vi.mock("next/navigation");

const { listBaselines } = vi.hoisted(() => ({ listBaselines: vi.fn() }));

vi.mock("@/lib/orpc/server", async () => {
  const { createTanstackQueryUtils } = await import("@orpc/tanstack-query");
  return {
    orpcServer: createTanstackQueryUtils({ snapshots: { listBaselines } }),
  };
});

const { default: SnapshotsPage } = await import("../page");

const renderPage = async () =>
  render(await SnapshotsPage(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
    ),
  });

describe("SnapshotsPage", () => {
  // Each server request gets its own query client; under jsdom the page shares one.
  beforeEach(() => {
    getQueryClient().clear();
  });

  it("should list every project's baseline snapshots, each linking to its snapshot page", async () => {
    const snapshots = [
      mocks.build.generateProjectBaselineSnapshot({
        id: "018f0000-0000-7000-8000-0000000000a1",
        buildId: "018f0000-0000-7000-8000-0000000000b1",
        project: { id: "018f0000-0000-7000-8000-000000000001", name: "Acme Web" },
        targetTitle: "Button",
        targetName: "Primary",
        viewportName: "desktop",
      }),
      mocks.build.generateProjectBaselineSnapshot({
        id: "018f0000-0000-7000-8000-0000000000a2",
        buildId: "018f0000-0000-7000-8000-0000000000b2",
        project: { id: "018f0000-0000-7000-8000-000000000002", name: "Acme Admin" },
        targetTitle: "Card",
        targetName: "Default",
        viewportName: "mobile",
      }),
    ];
    listBaselines.mockResolvedValue({ snapshots, total: 2, nextCursor: null });

    await renderPage();

    expect(screen.getByRole("heading", { name: "snapshots" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "snapshot of Button Primary, Acme Web, chromium desktop" }),
    ).toHaveAttribute(
      "href",
      "/projects/018f0000-0000-7000-8000-000000000001/builds/018f0000-0000-7000-8000-0000000000b1/snapshots/018f0000-0000-7000-8000-0000000000a1",
    );
    expect(
      screen.getByRole("link", { name: "snapshot of Card Default, Acme Admin, chromium mobile" }),
    ).toHaveAttribute(
      "href",
      "/projects/018f0000-0000-7000-8000-000000000002/builds/018f0000-0000-7000-8000-0000000000b2/snapshots/018f0000-0000-7000-8000-0000000000a2",
    );
  });

  it("should mark flaky and warned baselines", async () => {
    listBaselines.mockResolvedValue({
      snapshots: [
        mocks.build.generateProjectBaselineSnapshot({
          project: { id: "018f0000-0000-7000-8000-000000000001", name: "Acme Web" },
          targetTitle: "Chart",
          targetName: "Animated",
          flags: ["flaky", "warning"],
        }),
      ],
      total: 1,
      nextCursor: null,
    });

    await renderPage();

    expect(
      screen.getByRole("link", {
        name: "snapshot of Chart Animated, Acme Web, chromium desktop, has warnings, flaky",
      }),
    ).toBeVisible();
  });

  it("should say when there are no baselines yet", async () => {
    listBaselines.mockResolvedValue({ snapshots: [], total: 0, nextCursor: null });

    await renderPage();

    expect(screen.getByText("no snapshots found")).toBeVisible();
  });
});
