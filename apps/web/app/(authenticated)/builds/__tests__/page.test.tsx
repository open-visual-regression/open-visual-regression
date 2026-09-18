import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen } from "@/test-utils";

const { listBuilds } = vi.hoisted(() => ({ listBuilds: vi.fn() }));

// The real module is server-only, and it is the page's single data dependency.
vi.mock("@/lib/orpc/server", async () => {
  const { createTanstackQueryUtils } = await import("@orpc/tanstack-query");
  return { orpcServer: createTanstackQueryUtils({ builds: { list: listBuilds } }) };
});

const { default: BuildsPage } = await import("../page");

describe("BuildsPage", () => {
  // `getQueryClient` memoizes one client per browser session, so the prefetched
  // page can only be rendered once per module.
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

    render(await BuildsPage(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
      ),
    });

    expect(screen.getByRole("heading", { name: "builds" })).toBeVisible();

    expect(screen.getByText("acme web build")).toBeVisible();
    expect(screen.getByText("acme admin build")).toBeVisible();

    for (const build of builds) {
      expect(
        screen.getByRole("link", { name: new RegExp(build.commitSha.slice(0, 7)) }),
      ).toHaveAttribute("href", `/projects/${build.project.id}/builds/${build.id}`);
    }
  });
});
