import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { mocks } from "@ovr/mocks";

import { orpc } from "@/lib/orpc/client";
import { projectsListInfiniteOptions } from "@/lib/orpc/projects-query";
import { describe, expect, it, render, screen } from "@/test-utils";

import { ProjectsSection } from "../ProjectsSection";

type RenderSectionOptions = {
  nextCursor?: { createdAt: string; id: string } | null;
};

const renderSection = (
  projects: ReturnType<typeof mocks.project.generateProject>[],
  { nextCursor = null }: RenderSectionOptions = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  const options = projectsListInfiniteOptions();
  queryClient.setQueryData(orpc.projects.list.infiniteKey(options), {
    pages: [{ projects, nextCursor }],
    pageParams: [options.initialPageParam],
  });

  return render(<ProjectsSection role="admin" />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

describe("ProjectsSection", () => {
  it("should show the onboarding empty state when there are no projects", () => {
    renderSection([]);

    expect(screen.getByRole("heading", { name: "no projects yet" })).toBeVisible();
  });

  it("should render a card for each project", () => {
    const project = mocks.project.generateProject({ name: "storefront" });
    renderSection([project]);

    expect(screen.getByText("storefront")).toBeVisible();
  });

  it("should show a row of skeleton cards when there is a next page", () => {
    const project = mocks.project.generateProject();
    const { container } = renderSection([project], {
      nextCursor: { createdAt: project.createdAt, id: project.id },
    });

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("should not show skeleton cards when there is no next page", () => {
    const project = mocks.project.generateProject();
    const { container } = renderSection([project], { nextCursor: null });

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(0);
  });
});
