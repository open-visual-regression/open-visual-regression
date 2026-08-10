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
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { SnapshotsSection } from "../SnapshotsSection";

const BUILD_ID = "018f0000-0000-7000-8000-000000000000";
const PROJECT_ID = "018f0000-0000-7000-8000-000000000001";

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

const listKey = () =>
  orpc.snapshots.list.infiniteKey(snapshotsListInfiniteOptions(BUILD_ID, undefined, {}));

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });

const seedPages = (queryClient: QueryClient, pages: ListOutputSchema[], updatedAt?: number) =>
  queryClient.setQueryData(
    listKey(),
    { pages, pageParams: pages.map((_, index) => (index === 0 ? undefined : CURSOR)) },
    updatedAt === undefined ? undefined : { updatedAt },
  );

type RenderOptions = {
  queryClient?: QueryClient;
  search?: string;
};

const renderSection = ({ queryClient = createQueryClient(), search }: RenderOptions = {}) =>
  render(<SnapshotsSection projectId={PROJECT_ID} buildId={BUILD_ID} search={search} />, {
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
          <SnapshotsSection projectId={PROJECT_ID} buildId={BUILD_ID} />
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
});
