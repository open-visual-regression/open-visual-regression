import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { type BuildSnapshotSchema, type ListOutputSchema } from "@ovr/api/contracts/snapshots";
import { mocks } from "@ovr/mocks";

import { orpc } from "@/lib/orpc/client";
import { snapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { type SnapshotFilters } from "@/lib/utils/snapshotFilters";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { SnapshotsSection } from "../SnapshotsSection";

const BUILD_ID = "018f0000-0000-7000-8000-000000000000";

const CURSOR = {
  statusPriority: 3,
  targetTitle: "Home Page",
  targetName: "home-page",
  browser: "chromium",
  viewportWidth: 1280,
  id: "018f0000-0000-7000-8000-0000000000ff",
};

const toPage = (snapshots: BuildSnapshotSchema[], total = snapshots.length): ListOutputSchema => ({
  snapshots,
  total,
  nextCursor: null,
});

const NO_FILTERS: SnapshotFilters = { statuses: [], browsers: [], viewports: [], flags: [] };

const listKey = (filters = NO_FILTERS) =>
  orpc.snapshots.list.infiniteKey(snapshotsListInfiniteOptions({ buildId: BUILD_ID }, filters));

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });

const seedPages = (
  queryClient: QueryClient,
  pages: ListOutputSchema[],
  updatedAt?: number,
  filters = NO_FILTERS,
) =>
  queryClient.setQueryData(
    listKey(filters),
    { pages, pageParams: pages.map((_, index) => (index === 0 ? undefined : CURSOR)) },
    updatedAt === undefined ? undefined : { updatedAt },
  );

type RenderOptions = {
  queryClient?: QueryClient;
  filters?: SnapshotFilters;
};

const renderSection = ({
  queryClient = createQueryClient(),
  filters = NO_FILTERS,
}: RenderOptions = {}) =>
  render(<SnapshotsSection buildId={BUILD_ID} filters={filters} />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

describe("SnapshotsSection", () => {
  it("should render every snapshot from the hydrated first page", () => {
    const queryClient = createQueryClient();
    seedPages(queryClient, [
      toPage([
        mocks.build.generateBuildSnapshot({ targetName: "home-page" }),
        mocks.build.generateBuildSnapshot({ targetName: "checkout-page" }),
      ]),
    ]);

    renderSection({ queryClient });

    expect(screen.getByText("home-page")).toBeVisible();
    expect(screen.getByText("checkout-page")).toBeVisible();
  });

  it("should render the snapshots from every loaded page", () => {
    const queryClient = createQueryClient();
    seedPages(queryClient, [
      {
        snapshots: [mocks.build.generateBuildSnapshot({ targetName: "home-page" })],
        total: 2,
        nextCursor: CURSOR,
      },
      toPage([mocks.build.generateBuildSnapshot({ targetName: "checkout-page" })], 2),
    ]);

    renderSection({ queryClient });

    expect(screen.getByText("home-page")).toBeVisible();
    expect(screen.getByText("checkout-page")).toBeVisible();
  });

  it("should replace cached snapshots when the server hydrates a newer page", async () => {
    const queryClient = createQueryClient();
    seedPages(
      queryClient,
      [
        toPage([
          mocks.build.generateBuildSnapshot({ targetName: "home-page", status: "needs_review" }),
        ]),
      ],
      Date.now() - 60_000,
    );

    const serverQueryClient = createQueryClient();
    seedPages(serverQueryClient, [
      toPage([mocks.build.generateBuildSnapshot({ targetName: "home-page", status: "approved" })]),
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydrate(serverQueryClient)}>
          <SnapshotsSection buildId={BUILD_ID} filters={NO_FILTERS} />
        </HydrationBoundary>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText("approved")).toBeVisible());
    expect(screen.queryByText("needs review")).not.toBeInTheDocument();
  });

  it("should show the empty state for a build with no snapshots", () => {
    const queryClient = createQueryClient();
    seedPages(queryClient, [toPage([])]);

    renderSection({ queryClient });

    expect(screen.getByText("no snapshots found")).toBeVisible();
  });

  it("should show the search term when no snapshots match it", () => {
    const filters = { ...NO_FILTERS, search: "home" };
    const queryClient = createQueryClient();
    seedPages(queryClient, [toPage([])], undefined, filters);

    renderSection({ queryClient, filters });

    expect(screen.getByText('no snapshots found matching "home"')).toBeVisible();
  });

  it("should list every build's snapshots by name with their projects, without carrying filters into the links", () => {
    const filters = { ...NO_FILTERS, flags: ["flaky" as const] };
    const queryClient = createQueryClient();
    queryClient.setQueryData(
      orpc.snapshots.list.infiniteKey(snapshotsListInfiniteOptions({ sort: "name" }, filters)),
      {
        pages: [
          toPage([
            mocks.build.generateBuildSnapshot({
              id: "snapshot-1",
              buildId: "build-1",
              project: { id: "project-1", name: "Storefront" },
              targetName: "home-page",
            }),
          ]),
        ],
        pageParams: [undefined],
      },
    );

    render(<SnapshotsSection sort="name" filters={filters} showProject />, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    expect(screen.getByText("Storefront")).toBeVisible();
    expect(screen.getByRole("link", { name: /home-page/ })).toHaveAttribute(
      "href",
      "/projects/project-1/builds/build-1/snapshots/snapshot-1",
    );
  });
});
