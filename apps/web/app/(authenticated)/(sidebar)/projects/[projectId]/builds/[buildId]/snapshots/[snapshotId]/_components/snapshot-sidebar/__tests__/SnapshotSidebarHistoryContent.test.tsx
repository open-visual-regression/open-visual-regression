import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type GetHistoryOutputSchema } from "@ovr/api/contracts/snapshots";
import { mocks } from "@ovr/mocks";

import { orpc } from "@/lib/orpc/client";
import { snapshotHistoryInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotSidebarHistoryContent } from "../SnapshotSidebarHistoryContent";

const PROJECT_ID = "018f0000-0000-7000-8000-000000000001";
const SNAPSHOT_ID = "018f0000-0000-7000-8000-000000000002";

const NEXT_CURSOR = {
  createdAt: "2026-06-22T00:00:00.000Z",
  buildId: "018f0000-0000-7000-8000-0000000000ff",
  direction: "next",
} as const;

const PREVIOUS_CURSOR = { ...NEXT_CURSOR, direction: "previous" } as const;

const toPage = (
  entries: GetHistoryOutputSchema["snapshots"],
  cursors: Partial<Pick<GetHistoryOutputSchema, "nextCursor" | "previousCursor">> = {},
): GetHistoryOutputSchema => ({
  branch: "main",
  snapshots: entries,
  nextCursor: cursors.nextCursor ?? null,
  previousCursor: cursors.previousCursor ?? null,
});

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });

const seedPages = (
  queryClient: QueryClient,
  pages: GetHistoryOutputSchema[],
  startAt: "snapshot" | "latest" = "snapshot",
) =>
  queryClient.setQueryData(
    orpc.snapshots.getHistory.infiniteKey(snapshotHistoryInfiniteOptions(SNAPSHOT_ID, startAt)),
    { pages, pageParams: pages.map((_, index) => (index === 0 ? undefined : NEXT_CURSOR)) },
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
      toPage([mocks.build.generateSnapshotHistoryEntry({ buildName: "Add checkout page" })], {
        nextCursor: NEXT_CURSOR,
      }),
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

  it("should not offer to jump to the latest snapshot when it is already loaded", () => {
    const queryClient = createQueryClient();
    seedPages(queryClient, [toPage([mocks.build.generateSnapshotHistoryEntry()])]);

    renderContent(queryClient);

    expect(screen.queryByRole("button", { name: "jump to latest" })).not.toBeInTheDocument();
  });

  it("should jump to the latest snapshots when there are newer ones", async ({ user }) => {
    const queryClient = createQueryClient();
    seedPages(queryClient, [
      toPage([mocks.build.generateSnapshotHistoryEntry({ buildName: "Add checkout page" })], {
        previousCursor: PREVIOUS_CURSOR,
      }),
    ]);
    seedPages(
      queryClient,
      [toPage([mocks.build.generateSnapshotHistoryEntry({ buildName: "Release prep" })])],
      "latest",
    );

    renderContent(queryClient);
    await user.click(screen.getByRole("button", { name: "jump to latest" }));

    expect(screen.getByText("Release prep")).toBeVisible();
    expect(screen.queryByText("Add checkout page")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "jump to latest" })).not.toBeInTheDocument();
  });
});
