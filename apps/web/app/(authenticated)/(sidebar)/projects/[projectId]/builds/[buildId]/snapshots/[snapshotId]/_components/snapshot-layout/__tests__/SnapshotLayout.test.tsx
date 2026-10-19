import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { orpc } from "@/lib/orpc/client";
import { snapshotHistoryInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotLayout } from "../SnapshotLayout";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const snapshot: SnapshotSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  viewportName: "desktop",
  targetId: "ui-button--primary",
  targetName: "Kitchen Sink",
  targetTitle: "UI/Button",
  imagePath: "new.png",
  status: "needs_review",
  errorMessage: null,
  hasUncaughtPageError: false,
  isFlaky: false,
  flags: [],
  isRebuildable: false,
  isReviewable: true,
  errorLogs: [],
  queuedMs: null,
  processingMs: null,
};

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });

const renderComponent = (queryClient = createQueryClient()) =>
  render(
    <SnapshotLayout
      snapshot={snapshot}
      diff={null}
      projectId="019edfc7-e040-7492-86b2-ccfdc00cf6e1"
      buildId="019edfc7-e040-7492-86b2-ccfdc00cf6e0"
      prevSnapshotId={null}
      nextSnapshotId={null}
      position={null}
      total={null}
      canReview={true}
      sidebar={<div>sidebar contents</div>}
    >
      <div>snapshot contents</div>
    </SnapshotLayout>,
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    },
  );

describe("SnapshotLayout", () => {
  it("should hide the sidebar until the toggle is clicked", () => {
    renderComponent();

    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("should open the sidebar when the expand toggle is clicked", async ({ user }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /expand sidebar/i }));

    expect(screen.getByRole("complementary")).toHaveTextContent("sidebar contents");
  });

  it("should close the sidebar when the collapse toggle is clicked", async ({ user }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /expand sidebar/i }));
    await user.click(screen.getByRole("button", { name: /collapse sidebar/i }));

    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("should prefetch the snapshot history when the sidebar opens", async ({ user }) => {
    const queryClient = createQueryClient();
    const prefetchInfiniteQuery = vi
      .spyOn(queryClient, "prefetchInfiniteQuery")
      .mockResolvedValue(undefined);
    renderComponent(queryClient);

    await user.click(screen.getByRole("button", { name: /expand sidebar/i }));

    expect(prefetchInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: orpc.snapshots.getHistory.infiniteKey(
          snapshotHistoryInfiniteOptions(snapshot.id),
        ),
      }),
    );
  });

  it("should not prefetch the snapshot history when the sidebar closes", async ({ user }) => {
    const queryClient = createQueryClient();
    const prefetchInfiniteQuery = vi
      .spyOn(queryClient, "prefetchInfiniteQuery")
      .mockResolvedValue(undefined);
    renderComponent(queryClient);

    await user.click(screen.getByRole("button", { name: /expand sidebar/i }));
    await user.click(screen.getByRole("button", { name: /collapse sidebar/i }));

    expect(prefetchInfiniteQuery).toHaveBeenCalledTimes(1);
  });
});
