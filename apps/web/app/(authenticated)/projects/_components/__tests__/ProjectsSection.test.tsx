import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { mocks } from "@ovr/mocks";

import { orpc } from "@/lib/orpc/client";
import { projectsListInfiniteOptions } from "@/lib/orpc/projects-query";
import { describe, expect, it, render, screen } from "@/test-utils";

import { ProjectsSection } from "../ProjectsSection";

const renderSection = (projects: ReturnType<typeof mocks.project.generateProject>[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  const options = projectsListInfiniteOptions();
  queryClient.setQueryData(orpc.projects.list.infiniteKey(options), {
    pages: [{ projects, nextCursor: null }],
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
});
