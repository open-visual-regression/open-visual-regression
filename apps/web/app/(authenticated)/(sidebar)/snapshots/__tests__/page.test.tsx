import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { getQueryClient } from "@/lib/orpc/query-client";
import { describe, expect, it, render, screen } from "@/test-utils";

vi.mock("next/navigation");

const { listBaselines, listBaselineFlags, listProjects } = vi.hoisted(() => ({
  listBaselines: vi.fn(),
  listBaselineFlags: vi.fn(),
  listProjects: vi.fn(),
}));

vi.mock("@/lib/orpc/server", async () => {
  const { createTanstackQueryUtils } = await import("@orpc/tanstack-query");
  return {
    orpcServer: createTanstackQueryUtils({
      projects: { list: listProjects },
      snapshots: { listBaselines, listBaselineFlags },
    }),
  };
});

const { default: SnapshotsPage } = await import("../page");

const PROJECTS = [
  mocks.project.generateProject({ id: "018f0000-0000-7000-8000-000000000001", name: "Acme Web" }),
  mocks.project.generateProject({ id: "018f0000-0000-7000-8000-000000000002", name: "Acme Admin" }),
];

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
  // Each server request gets its own query client; under jsdom the page shares one.
  beforeEach(() => {
    getQueryClient().clear();
    listBaselineFlags.mockResolvedValue({ flags: ["flaky", "warning"] });
    listProjects.mockResolvedValue({ projects: PROJECTS, nextCursor: null });
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

  it("should offer a flags facet with the flags the baselines have", async () => {
    listBaselines.mockResolvedValue({ snapshots: [], total: 0, nextCursor: null });

    await renderPage();

    expect(screen.getByRole("button", { name: /^flags\s+any$/i })).toBeVisible();
  });

  it("should hide the flags facet when no baseline has a flag", async () => {
    listBaselineFlags.mockResolvedValue({ flags: [] });
    listBaselines.mockResolvedValue({ snapshots: [], total: 0, nextCursor: null });

    await renderPage();

    expect(screen.queryByRole("button", { name: /^flags/i })).not.toBeInTheDocument();
  });

  it("should apply the flags from the url to the snapshots query and the facet trigger", async () => {
    listBaselines.mockResolvedValue({ snapshots: [], total: 0, nextCursor: null });

    await renderPage({ flag: "flaky" });

    expect(screen.getByRole("button", { name: /^flags\s+flaky$/i })).toBeVisible();
    expect(listBaselines).toHaveBeenCalledWith(
      expect.objectContaining({ flags: ["flaky"] }),
      expect.anything(),
    );
  });

  it("should offer a project facet listing every project", async ({ user }) => {
    listBaselines.mockResolvedValue({ snapshots: [], total: 0, nextCursor: null });

    await renderPage();
    await user.click(screen.getByRole("button", { name: /^project\s+any$/i }));

    expect(await screen.findByRole("checkbox", { name: "Acme Web" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Acme Admin" })).toBeVisible();
  });

  it("should hide the project facet when there is only one project", async () => {
    listProjects.mockResolvedValue({ projects: PROJECTS.slice(0, 1), nextCursor: null });
    listBaselines.mockResolvedValue({ snapshots: [], total: 0, nextCursor: null });

    await renderPage();

    expect(screen.queryByRole("button", { name: /^project/i })).not.toBeInTheDocument();
  });

  it("should apply the projects from the url to the snapshots query and the facet trigger", async () => {
    listBaselines.mockResolvedValue({ snapshots: [], total: 0, nextCursor: null });

    await renderPage({ project: PROJECTS[1]!.id, flag: "flaky" });

    expect(screen.getByRole("button", { name: /^project\s+Acme Admin$/i })).toBeVisible();
    expect(listBaselines).toHaveBeenCalledWith(
      expect.objectContaining({ projectIds: [PROJECTS[1]!.id], flags: ["flaky"] }),
      expect.anything(),
    );
  });
});
