import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen } from "@/test-utils";

vi.mock("next/navigation");

const { listBuilds, listStatuses, listBranches, listAuthors } = vi.hoisted(() => ({
  listBuilds: vi.fn(),
  listStatuses: vi.fn(),
  listBranches: vi.fn(),
  listAuthors: vi.fn(),
}));

vi.mock("@/lib/orpc/server", async () => {
  const { createTanstackQueryUtils } = await import("@orpc/tanstack-query");
  return {
    orpcServer: createTanstackQueryUtils({
      builds: {
        list: listBuilds,
        listStatuses,
        listBranches,
        listAuthors,
      },
    }),
  };
});

const { default: BuildsPage } = await import("../page");

const renderPage = async (searchParams: Record<string, string | string[]> = {}) =>
  render(
    await BuildsPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve(searchParams),
    }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
      ),
    },
  );

describe("BuildsPage", () => {
  beforeEach(() => {
    listStatuses.mockResolvedValue({ statuses: ["queued", "needs_review"] });
    listBranches.mockResolvedValue({ branches: ["main", "develop"] });
    listAuthors.mockResolvedValue({ authors: ["Jordan Lee", "Alex Kim"] });
  });

  it("should list every project's builds, each linking to its own build page", async () => {
    const builds = [
      mocks.build.generateBuild({
        name: "acme web build",
        commitSha: "4f2a91e1234567890",
        project: { id: "018f0000-0000-7000-8000-000000000000", name: "Acme Web" },
      }),
      mocks.build.generateBuild({
        name: "acme admin build",
        commitSha: "7c3b82f1234567890",
        project: { id: "018f0000-0000-7000-8000-000000000001", name: "Acme Admin" },
      }),
    ];
    listBuilds.mockResolvedValue({ builds, total: builds.length, nextCursor: null });

    await renderPage();

    expect(screen.getByRole("heading", { name: "builds" })).toBeVisible();

    expect(screen.getByText("acme web build")).toBeVisible();
    expect(screen.getByText("acme admin build")).toBeVisible();
    expect(screen.getByText("Acme Web")).toBeVisible();
    expect(screen.getByText("Acme Admin")).toBeVisible();

    for (const build of builds) {
      expect(
        screen.getByRole("link", { name: new RegExp(build.commitSha.slice(0, 7)) }),
      ).toHaveAttribute("href", `/projects/${build.project.id}/builds/${build.id}`);
    }

    expect(listStatuses).toHaveBeenCalledWith({}, expect.anything());
    expect(listBranches).toHaveBeenCalledWith({ search: undefined }, expect.anything());
    expect(listAuthors).toHaveBeenCalledWith({ search: undefined }, expect.anything());
  });

  it("should offer a status, branch and author facet sourced from every project", async () => {
    listBuilds.mockResolvedValue({ builds: [], total: 0, nextCursor: null });

    await renderPage();

    expect(screen.getByRole("button", { name: /^status\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^branch\s+any$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^author\s+any$/i })).toBeVisible();
  });

  it("should apply the filters from the url to the builds query and the facet triggers", async () => {
    listBuilds.mockResolvedValue({ builds: [], total: 0, nextCursor: null });

    await renderPage({ status: "queued", branch: "main", author: "Jordan Lee", search: "cart" });

    expect(screen.getByRole("button", { name: /^status\s+queued$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^branch\s+main$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^author\s+Jordan Lee$/i })).toBeVisible();

    expect(listBuilds).toHaveBeenCalledWith(
      expect.objectContaining({
        statuses: ["queued"],
        branches: ["main"],
        authors: ["Jordan Lee"],
        search: "cart",
      }),
      expect.anything(),
    );
  });

  it("should submit the search field back to the builds page", async () => {
    listBuilds.mockResolvedValue({ builds: [], total: 0, nextCursor: null });

    await renderPage();

    expect(screen.getByRole("search")).toHaveAttribute("action", "/builds");
  });
});
