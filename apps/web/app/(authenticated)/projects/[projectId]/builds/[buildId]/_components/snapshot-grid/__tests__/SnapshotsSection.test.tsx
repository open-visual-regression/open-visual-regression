import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type BuildSnapshotSchema, type ListOutputSchema } from "@ovr/api/contracts/snapshots";
import { mocks } from "@ovr/mocks";

import { orpc } from "@/lib/orpc/client";
import { snapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { describe, expect, it, render, screen } from "@/test-utils";

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

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });

type RenderOptions = {
  queryClient?: QueryClient;
  search?: string;
};

const renderSection = (
  initialPage: ListOutputSchema,
  { queryClient = createQueryClient(), search }: RenderOptions = {},
) =>
  render(
    <SnapshotsSection
      projectId={PROJECT_ID}
      buildId={BUILD_ID}
      initialPage={initialPage}
      search={search}
    />,
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    },
  );

describe("SnapshotsSection", () => {
  it("should render every snapshot from the server-rendered first page", () => {
    renderSection(
      toPage([
        mocks.build.generateBuildSnapshot({ targetName: "home-page" }),
        mocks.build.generateBuildSnapshot({ targetName: "checkout-page" }),
      ]),
    );

    expect(screen.getByText("home-page")).toBeVisible();
    expect(screen.getByText("checkout-page")).toBeVisible();
  });

  it("should render the snapshots from every loaded page", () => {
    const queryClient = createQueryClient();
    const options = snapshotsListInfiniteOptions(BUILD_ID, undefined, {});

    queryClient.setQueryData(orpc.snapshots.list.infiniteKey(options), {
      pages: [
        {
          snapshots: [mocks.build.generateBuildSnapshot({ targetName: "home-page" })],
          total: 2,
          nextCursor: CURSOR,
        },
        {
          snapshots: [mocks.build.generateBuildSnapshot({ targetName: "checkout-page" })],
          total: 2,
          nextCursor: null,
        },
      ],
      pageParams: [undefined, CURSOR],
    });

    renderSection(toPage([]), { queryClient });

    expect(screen.getByText("home-page")).toBeVisible();
    expect(screen.getByText("checkout-page")).toBeVisible();
  });

  it("should keep loaded pages when the page re-renders with a fresh first page", () => {
    const queryClient = createQueryClient();
    const options = snapshotsListInfiniteOptions(BUILD_ID, undefined, {});

    queryClient.setQueryData(orpc.snapshots.list.infiniteKey(options), {
      pages: [
        {
          snapshots: [mocks.build.generateBuildSnapshot({ targetName: "home-page" })],
          total: 2,
          nextCursor: CURSOR,
        },
        {
          snapshots: [mocks.build.generateBuildSnapshot({ targetName: "checkout-page" })],
          total: 2,
          nextCursor: null,
        },
      ],
      pageParams: [undefined, CURSOR],
    });

    const { rerender } = renderSection(toPage([]), { queryClient });

    rerender(
      <QueryClientProvider client={queryClient}>
        <SnapshotsSection
          projectId={PROJECT_ID}
          buildId={BUILD_ID}
          initialPage={toPage([mocks.build.generateBuildSnapshot({ targetName: "home-page" })])}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText("checkout-page")).toBeVisible();
  });

  it("should show the empty state for a build with no snapshots", () => {
    renderSection(toPage([]));

    expect(screen.getByText("no snapshots found")).toBeVisible();
  });
});
