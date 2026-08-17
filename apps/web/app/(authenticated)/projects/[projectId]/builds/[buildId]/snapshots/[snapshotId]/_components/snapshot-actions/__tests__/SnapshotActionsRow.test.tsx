import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { vi } from "vitest";

import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { SnapshotActionsRow } from "../SnapshotActionsRow";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockCastVote = vi.mocked(serverClient.diffs.castVote);
const mockRefresh = vi.mocked(useRouter)().refresh;
const mockPush = vi.mocked(useRouter)().push;

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
  errorLogs: [],
};

const diff: DiffSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e3",
  processingStatus: "success",
  reviewStatus: "needs_review",
  diffImagePath: "diff.png",
  pixelDiffCount: 10,
  diffPercent: 1,
  baselineSnapshot: { imagePath: "baseline.png", commitSha: null, commitUrl: null },
};

const projectId = "019edfc7-e040-7492-86b2-ccfdc00cf6e1";
const buildId = "019edfc7-e040-7492-86b2-ccfdc00cf6e0";
const prevSnapshotId = "019edfc7-e040-7492-86b2-ccfdc00cf6e4";
const nextSnapshotId = "019edfc7-e040-7492-86b2-ccfdc00cf6e5";

const renderComponent = (
  props: Partial<{
    snapshot: SnapshotSchema;
    diff: DiffSchema | null;
    prevSnapshotId: string | null;
    nextSnapshotId: string | null;
    position: number | null;
    total: number | null;
    canReview: boolean;
    sidebarCollapsed: boolean;
    onToggleSidebar: () => void;
  }> = {},
) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SnapshotActionsRow
        snapshot={snapshot}
        diff={diff}
        projectId={projectId}
        buildId={buildId}
        prevSnapshotId={prevSnapshotId}
        nextSnapshotId={nextSnapshotId}
        position={3}
        total={5}
        canReview={true}
        sidebarCollapsed={true}
        onToggleSidebar={vi.fn()}
        {...props}
      />
      <Toaster />
    </QueryClientProvider>,
  );

describe("SnapshotActionsRow", () => {
  const nextSnapshotHref = `/projects/${projectId}/builds/${buildId}/snapshots/${nextSnapshotId}`;

  it("should approve the diff and navigate to the next snapshot immediately, without waiting for the request", async ({
    user,
  }) => {
    mockCastVote.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    expect(mockCastVote).toHaveBeenCalledWith({ diffId: diff.id, vote: "approve" });
    expect(mockPush).toHaveBeenCalledWith(nextSnapshotHref);
  });

  it("should reject the diff and navigate to the next snapshot immediately, without waiting for the request", async ({
    user,
  }) => {
    mockCastVote.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^reject$/i }));

    expect(mockCastVote).toHaveBeenCalledWith({ diffId: diff.id, vote: "reject" });
    expect(mockPush).toHaveBeenCalledWith(nextSnapshotHref);
  });

  it("should refresh the build page behind it after approving and moving on", async ({ user }) => {
    mockCastVote.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    expect(mockPush).toHaveBeenCalledWith(nextSnapshotHref);
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should refresh without navigating when approving the last snapshot in the queue", async ({
    user,
  }) => {
    mockCastVote.mockResolvedValue([null, undefined]);
    renderComponent({ nextSnapshotId: null });

    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    expect(mockPush).not.toHaveBeenCalled();
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should refresh without navigating when rejecting the last snapshot in the queue", async ({
    user,
  }) => {
    mockCastVote.mockResolvedValue([null, undefined]);
    renderComponent({ nextSnapshotId: null });

    await user.click(screen.getByRole("button", { name: /^reject$/i }));

    expect(mockPush).not.toHaveBeenCalled();
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should still navigate to the next snapshot optimistically, then show an error toast if approving fails", async ({
    user,
  }) => {
    mockCastVote.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    expect(mockPush).toHaveBeenCalledWith(nextSnapshotHref);
    expect(await screen.findByText("INTERNAL_SERVER_ERROR")).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("should still navigate to the next snapshot optimistically, then show an error toast if rejecting fails", async ({
    user,
  }) => {
    mockCastVote.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^reject$/i }));

    expect(mockPush).toHaveBeenCalledWith(nextSnapshotHref);
    expect(await screen.findByText("INTERNAL_SERVER_ERROR")).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("should show approve as disabled and labeled when already approved", () => {
    renderComponent({ snapshot: { ...snapshot, status: "approved" } });

    expect(screen.getByRole("button", { name: /^approved$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeEnabled();
  });

  it("should show reject as disabled and labeled when already rejected", () => {
    renderComponent({ snapshot: { ...snapshot, status: "rejected" } });

    expect(screen.getByRole("button", { name: /^rejected$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^approve$/i })).toBeEnabled();
  });

  it.each([
    ["there is no diff", null],
    ["the diff has not been resolved yet", { ...diff, reviewStatus: "not_required" as const }],
    ["the diff was unchanged", { ...diff, reviewStatus: "unchanged" as const }],
    ["the diff was auto approved", { ...diff, reviewStatus: "auto_approved" as const }],
  ])("should hide approve and reject when %s", (_description, diffInput) => {
    renderComponent({ diff: diffInput });

    expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^reject$/i })).not.toBeInTheDocument();
  });

  it("should hide approve and reject when the snapshot failed to render, even if the diff needs review", () => {
    renderComponent({ snapshot: { ...snapshot, status: "error" } });

    expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^reject$/i })).not.toBeInTheDocument();
  });

  it("should hide approve and reject for a viewer", () => {
    renderComponent({ canReview: false });

    expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^reject$/i })).not.toBeInTheDocument();
  });

  it("should link to the previous snapshot", () => {
    renderComponent();

    expect(screen.getByRole("link", { name: /prev/i })).toHaveAttribute(
      "href",
      `/projects/${projectId}/builds/${buildId}/snapshots/${prevSnapshotId}`,
    );
  });

  it("should link to the next snapshot", () => {
    renderComponent();

    expect(screen.getByRole("link", { name: /next/i })).toHaveAttribute(
      "href",
      `/projects/${projectId}/builds/${buildId}/snapshots/${nextSnapshotId}`,
    );
  });

  it("should disable prev when there is no previous snapshot", () => {
    renderComponent({ prevSnapshotId: null });

    expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
  });

  it("should disable next when there is no next snapshot", () => {
    renderComponent({ nextSnapshotId: null });

    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("should show the position within the review queue", () => {
    renderComponent({ position: 3, total: 5 });

    expect(screen.getByText("3/5")).toBeVisible();
  });

  it("should hide the position when the snapshot isn't in the review queue", () => {
    renderComponent({ position: null, total: null });

    expect(screen.queryByText(/^\d+\/\d+$/)).not.toBeInTheDocument();
  });

  it("should hide prev and next entirely when there is neither", () => {
    renderComponent({ prevSnapshotId: null, nextSnapshotId: null });

    expect(screen.queryByRole("button", { name: /prev/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("should label the sidebar toggle as expand when the sidebar is collapsed", () => {
    renderComponent({ sidebarCollapsed: true });

    expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeVisible();
  });

  it("should label the sidebar toggle as collapse when the sidebar is expanded", () => {
    renderComponent({ sidebarCollapsed: false });

    expect(screen.getByRole("button", { name: /collapse sidebar/i })).toBeVisible();
  });
});
