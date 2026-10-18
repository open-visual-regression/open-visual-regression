import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type GetHistoryOutputSchema } from "@ovr/api/contracts/snapshots";
import { mocks } from "@ovr/mocks";

import { orpc } from "@/lib/orpc/client";
import { snapshotHistoryInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotSidebarHistoryContent } from "../SnapshotSidebarHistoryContent";

const PROJECT_ID = "018f0000-0000-7000-8000-000000000001";
const SNAPSHOT_ID = "018f0000-0000-7000-8000-000000000002";

const CURSOR = {
  createdAt: "2026-06-22T00:00:00.000Z",
  buildId: "018f0000-0000-7000-8000-0000000000ff",
};

const toPage = (
  entries: GetHistoryOutputSchema["snapshots"],
  nextCursor: GetHistoryOutputSchema["nextCursor"] = null,
): GetHistoryOutputSchema => ({ branch: "main", snapshots: entries, nextCursor });

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });

const seedPages = (queryClient: QueryClient, pages: GetHistoryOutputSchema[]) =>
  queryClient.setQueryData(
    orpc.snapshots.getHistory.infiniteKey(snapshotHistoryInfiniteOptions(SNAPSHOT_ID)),
    { pages, pageParams: pages.map((_, index) => (index === 0 ? undefined : CURSOR)) },
  );

const renderContent = (queryClient: QueryClient) =>
  render(<SnapshotSidebarHistoryContent projectId={PROJECT_ID} snapshotId={SNAPSHOT_ID} />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

describe("SnapshotSidebarHistoryContent", () => {
  it("should render the snapshots from every loaded page", () => {
    const queryClient = createQueryClient();
    seedPages(queryClient, [
      toPage(
        [mocks.build.generateSnapshotHistoryEntry({ buildName: "Add checkout page" })],
        CURSOR,
      ),
      toPage([mocks.build.generateSnapshotHistoryEntry({ buildName: "Fix header spacing" })]),
    ]);

    renderContent(queryClient);

    expect(screen.getByText("Add checkout page")).toBeVisible();
    expect(screen.getByText("Fix header spacing")).toBeVisible();
  });

  it("should show the empty message for the history's branch", () => {
    const queryClient = createQueryClient();
    seedPages(queryClient, [toPage([])]);

    renderContent(queryClient);

    expect(screen.getByText("no snapshots on main yet")).toBeVisible();
  });
});
