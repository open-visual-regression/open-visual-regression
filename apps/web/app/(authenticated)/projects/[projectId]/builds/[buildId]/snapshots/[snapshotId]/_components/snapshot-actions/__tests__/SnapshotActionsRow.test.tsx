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

const snapshot: SnapshotSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  viewportName: "desktop",
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
  baselineSnapshot: { imagePath: "baseline.png" },
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
    sidebarCollapsed: boolean;
    onToggleSidebar: () => void;
  }> = {},
) =>
  render(
    <>
      <SnapshotActionsRow
        snapshot={snapshot}
        diff={diff}
        projectId={projectId}
        buildId={buildId}
        prevSnapshotId={prevSnapshotId}
        nextSnapshotId={nextSnapshotId}
        position={3}
        total={5}
        sidebarCollapsed={true}
        onToggleSidebar={vi.fn()}
        {...props}
      />
      <Toaster />
    </>,
  );

describe("SnapshotActionsRow", () => {
  it("should approve the diff", async ({ user }) => {
    mockCastVote.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    expect(mockCastVote).toHaveBeenCalledWith({ diffId: diff.id, vote: "approve" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should reject the diff", async ({ user }) => {
    mockCastVote.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^reject$/i }));

    expect(mockCastVote).toHaveBeenCalledWith({ diffId: diff.id, vote: "reject" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should show an error toast if approving fails", async ({ user }) => {
    mockCastVote.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    expect(await screen.findByText("INTERNAL_SERVER_ERROR")).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("should show an error toast if rejecting fails", async ({ user }) => {
    mockCastVote.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /^reject$/i }));

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
    ["the diff does not require review", { ...diff, reviewStatus: "not_required" as const }],
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

  it("should link to the previous snapshot", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: /prev/i })).toHaveAttribute(
      "href",
      `/projects/${projectId}/builds/${buildId}/snapshots/${prevSnapshotId}`,
    );
  });

  it("should link to the next snapshot", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: /next/i })).toHaveAttribute(
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
});
