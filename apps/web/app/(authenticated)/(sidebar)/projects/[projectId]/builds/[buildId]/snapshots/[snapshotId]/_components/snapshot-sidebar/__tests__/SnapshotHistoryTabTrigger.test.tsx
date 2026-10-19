import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Tabs, TabsList } from "@ovr/ui/components/tabs";

import { mockHandlers } from "@/lib/testing/mockHandlers";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { SnapshotHistoryTabTrigger } from "../SnapshotHistoryTabTrigger";

const SNAPSHOT_ID = "018f0000-0000-7000-8000-000000000002";

const renderComponent = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <Tabs defaultValue="reviews">
        <TabsList>
          <SnapshotHistoryTabTrigger snapshotId={SNAPSHOT_ID} />
        </TabsList>
      </Tabs>
    </QueryClientProvider>,
  );

describe("SnapshotHistoryTabTrigger", () => {
  it("should prefetch the snapshot history when the tab is hovered", async ({ user }) => {
    const getHistory = mockHandlers.mockGetHistory();
    renderComponent();

    await user.hover(screen.getByRole("tab", { name: "History" }));

    await waitFor(() =>
      expect(getHistory).toHaveBeenCalledWith(expect.objectContaining({ snapshotId: SNAPSHOT_ID })),
    );
  });

  it("should prefetch the snapshot history when the tab is focused", async ({ user }) => {
    const getHistory = mockHandlers.mockGetHistory();
    renderComponent();

    await user.tab();

    expect(screen.getByRole("tab", { name: "History" })).toHaveFocus();
    await waitFor(() =>
      expect(getHistory).toHaveBeenCalledWith(expect.objectContaining({ snapshotId: SNAPSHOT_ID })),
    );
  });
});
