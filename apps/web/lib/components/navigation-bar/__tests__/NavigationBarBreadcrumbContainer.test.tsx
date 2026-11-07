import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { orpc } from "@/lib/orpc/client";
import { mockHandlers } from "@/lib/testing/mockHandlers";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen } from "@/test-utils";

import { NavigationBarBreadcrumbContainer } from "../NavigationBarBreadcrumbContainer";

vi.mock("next/navigation");

const mockUsePathname = vi.mocked(usePathname);

const renderBreadcrumb = (pathname: string, queryClient = new QueryClient()) => {
  mockUsePathname.mockReturnValue(pathname);

  return render(
    <QueryClientProvider client={queryClient}>
      <NavigationBarBreadcrumbContainer />
    </QueryClientProvider>,
  );
};

describe("NavigationBarBreadcrumbContainer", () => {
  it("should render the overview breadcrumb at the root path", () => {
    renderBreadcrumb("/");

    expect(screen.getByText("overview")).toBeVisible();
  });

  it("should resolve the project and build names from the query cache", () => {
    const project = mocks.project.generateProject({ name: "D's Construction" });
    const build = mocks.build.generateBuild({ name: "feat: add login" });
    const queryClient = new QueryClient();
    queryClient.setQueryData(orpc.projects.getOne.queryKey({ input: { projectId: project.id } }), {
      project,
    });
    queryClient.setQueryData(orpc.builds.getOne.queryKey({ input: { buildId: build.id } }), {
      build,
    });

    renderBreadcrumb(`/projects/${project.id}/builds/${build.id}`, queryClient);

    expect(screen.getByRole("link", { name: "D's Construction" })).toHaveAttribute(
      "href",
      `/projects/${project.id}`,
    );
    expect(screen.getByText("feat: add login")).toBeVisible();
  });

  it("should show a placeholder while the project name is loading", () => {
    const projectId = "018f0000-0000-7000-8000-000000000001";
    mockHandlers.mockGetProject({ pending: true });

    renderBreadcrumb(`/projects/${projectId}`);

    expect(screen.getByRole("status", { name: "loading" })).toBeVisible();
  });

  it("should fall back to the raw id when the project cannot be resolved", async () => {
    const projectId = "018f0000-0000-7000-8000-000000000001";
    mockHandlers.mockGetProject({ error: createORPCError("NOT_FOUND", 404) });

    renderBreadcrumb(`/projects/${projectId}`);

    expect(await screen.findByText(projectId)).toBeVisible();
  });
});
