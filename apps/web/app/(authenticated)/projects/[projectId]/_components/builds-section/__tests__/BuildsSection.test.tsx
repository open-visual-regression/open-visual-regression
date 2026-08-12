import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { mocks } from "@ovr/mocks";

import { buildsListInfiniteOptions } from "@/lib/orpc/builds-query";
import { orpc } from "@/lib/orpc/client";
import { describe, expect, it, render, screen } from "@/test-utils";

import { BuildsSection } from "../BuildsSection";

const PROJECT_ID = "018f0000-0000-7000-8000-000000000000";

type RenderSectionOptions = {
  search?: string;
};

const renderSection = (
  builds: ReturnType<typeof mocks.build.generateBuild>[],
  { search }: RenderSectionOptions = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  const options = buildsListInfiniteOptions(PROJECT_ID, search);
  queryClient.setQueryData(orpc.builds.list.infiniteKey(options), {
    pages: [{ builds, total: builds.length, nextCursor: null }],
    pageParams: [options.initialPageParam],
  });

  return render(<BuildsSection projectId={PROJECT_ID} search={search} />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

describe("BuildsSection", () => {
  it("should show the onboarding empty state when there are no builds", () => {
    renderSection([]);

    expect(screen.getByRole("heading", { name: "no builds yet" })).toBeVisible();
  });

  it("should render the builds list with a row for each build", () => {
    const build = mocks.build.generateBuild({ name: "fix: cart total rounding" });
    renderSection([build]);

    expect(screen.getByText("fix: cart total rounding")).toBeVisible();
  });

  it("should show a no-results message instead of the onboarding state during a search", () => {
    renderSection([], { search: "missing" });

    expect(screen.queryByRole("heading", { name: "no builds yet" })).toBeNull();
    expect(screen.getByText('no builds found matching "missing"')).toBeVisible();
  });
});
