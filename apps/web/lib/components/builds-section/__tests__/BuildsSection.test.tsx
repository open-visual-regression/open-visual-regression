import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { mocks } from "@ovr/mocks";

import { type BuildsListFilters, buildsListInfiniteOptions } from "@/lib/orpc/builds-query";
import { orpc } from "@/lib/orpc/client";
import { describe, expect, it, render, screen } from "@/test-utils";

import { BuildsSection } from "../BuildsSection";

const PROJECT_ID = "018f0000-0000-7000-8000-000000000000";

const EMPTY_STATE = <p>no builds yet</p>;

const renderSection = (
  builds: ReturnType<typeof mocks.build.generateBuild>[],
  props: React.ComponentProps<typeof BuildsSection> = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  const { projectIds, search, statuses, branches, authors } = props;
  const filters: BuildsListFilters = { projectIds, search, statuses, branches, authors };
  const options = buildsListInfiniteOptions(filters);
  queryClient.setQueryData(orpc.builds.list.infiniteKey(options), {
    pages: [{ builds, total: builds.length, nextCursor: null }],
    pageParams: [options.initialPageParam],
  });

  return render(<BuildsSection {...props} />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

describe("BuildsSection", () => {
  it("should show the empty state when there are no builds", () => {
    renderSection([], { projectIds: [PROJECT_ID], emptyState: EMPTY_STATE });

    expect(screen.getByText("no builds yet")).toBeVisible();
  });

  it("should render the builds list with a row for each build", () => {
    const build = mocks.build.generateBuild({ name: "fix: cart total rounding" });
    renderSection([build], { projectIds: [PROJECT_ID], emptyState: EMPTY_STATE });

    expect(screen.getByText("fix: cart total rounding")).toBeVisible();
  });

  it("should show a no-results message instead of the empty state during a search", () => {
    renderSection([], { projectIds: [PROJECT_ID], search: "missing", emptyState: EMPTY_STATE });

    expect(screen.queryByText("no builds yet")).toBeNull();
    expect(screen.getByText('no builds found matching "missing"')).toBeVisible();
  });

  it("should list builds from every project when no project is given", () => {
    const builds = [
      mocks.build.generateBuild({
        name: "acme web build",
        project: { id: PROJECT_ID, name: "Acme Web" },
      }),
      mocks.build.generateBuild({
        name: "acme admin build",
        project: { id: "018f0000-0000-7000-8000-000000000001", name: "Acme Admin" },
      }),
    ];
    renderSection(builds);

    expect(screen.getByText("acme web build")).toBeVisible();
    expect(screen.getByText("acme admin build")).toBeVisible();
  });

  it("should fall back to the list's own empty message when no empty state is given", () => {
    renderSection([]);

    expect(screen.getByText("no builds found")).toBeVisible();
  });
});
