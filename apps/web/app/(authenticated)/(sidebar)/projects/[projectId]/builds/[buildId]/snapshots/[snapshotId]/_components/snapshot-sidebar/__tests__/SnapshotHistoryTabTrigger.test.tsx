import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

import { Tabs, TabsList } from "@ovr/ui/components/tabs";

import { orpc } from "@/lib/orpc/client";
import { snapshotHistoryInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotHistoryTabTrigger } from "../SnapshotHistoryTabTrigger";

const SNAPSHOT_ID = "018f0000-0000-7000-8000-000000000002";

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const prefetchInfiniteQuery = vi
    .spyOn(queryClient, "prefetchInfiniteQuery")
    .mockResolvedValue(undefined);

  render(
    <QueryClientProvider client={queryClient}>
      <Tabs defaultValue="reviews">
        <TabsList>
          <SnapshotHistoryTabTrigger snapshotId={SNAPSHOT_ID} />
        </TabsList>
      </Tabs>
    </QueryClientProvider>,
  );

  return { prefetchInfiniteQuery };
};

const historyQuery = expect.objectContaining({
  queryKey: orpc.snapshots.getHistory.infiniteKey(snapshotHistoryInfiniteOptions(SNAPSHOT_ID)),
});

describe("SnapshotHistoryTabTrigger", () => {
  it("should prefetch the snapshot history when the tab is hovered", async ({ user }) => {
    const { prefetchInfiniteQuery } = renderComponent();

    await user.hover(screen.getByRole("tab", { name: "History" }));

    expect(prefetchInfiniteQuery).toHaveBeenCalledWith(historyQuery);
  });

  it("should prefetch the snapshot history when the tab is focused", async ({ user }) => {
    const { prefetchInfiniteQuery } = renderComponent();

    await user.tab();

    expect(screen.getByRole("tab", { name: "History" })).toHaveFocus();
    expect(prefetchInfiniteQuery).toHaveBeenCalledWith(historyQuery);
  });
});
