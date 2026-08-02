import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";
import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { BuildActionsRow, type BuildActionsRowProps } from "../BuildActionsRow";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockBulkCastVote = vi.mocked(serverClient.diffs.bulkCastVote);
const mockCancel = vi.mocked(serverClient.builds.cancel);
const mockRefresh = vi.mocked(useRouter)().refresh;

const projectId = "019edfc7-e040-7492-86b2-ccfdc00cf6e1";

const renderComponent = ({
  build = mocks.build.generateBuild({ status: "needs_review" }),
  snapshotCounts = {
    unchanged: 3,
    auto_approved: 0,
    approved: 0,
    needs_review: 2,
    rejected: 0,
    error: 1,
    canceled: 0,
    queued: 4,
    processing: 0,
  },
  canReview = true,
}: Partial<BuildActionsRowProps> = {}) =>
  render(
    <>
      <BuildActionsRow
        build={build}
        snapshotCounts={snapshotCounts}
        projectId={projectId}
        canReview={canReview}
      />
      <Toaster />
    </>,
  );

describe("BuildActionsRow", () => {
  it("should link back to the project page", () => {
    renderComponent();

    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      `/projects/${projectId}`,
    );
  });

  it("should hide both bulk actions when there are no reviewable snapshots", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "needs_review" }),
      snapshotCounts: {
        unchanged: 3,
        auto_approved: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 1,
        canceled: 0,
        queued: 4,
        processing: 0,
      },
    });

    expect(screen.queryByRole("button", { name: /approve all/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject all/i })).not.toBeInTheDocument();
  });

  it("should enable reject all when every reviewable snapshot is already approved", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "approved" }),
      snapshotCounts: {
        unchanged: 3,
        auto_approved: 0,
        approved: 2,
        needs_review: 0,
        rejected: 0,
        error: 1,
        canceled: 0,
        queued: 4,
        processing: 0,
      },
    });

    expect(screen.getByRole("button", { name: /^approved$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^reject all$/i })).toBeEnabled();
  });

  it("should enable approve all when at least one snapshot is rejected but others are still approved", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "rejected" }),
      snapshotCounts: {
        unchanged: 3,
        auto_approved: 0,
        approved: 1,
        needs_review: 0,
        rejected: 1,
        error: 1,
        canceled: 0,
        queued: 4,
        processing: 0,
      },
    });

    expect(screen.getByRole("button", { name: /^rejected$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^approve all$/i })).toBeEnabled();
  });

  it("should approve all needs-review snapshots", async ({ user }) => {
    mockBulkCastVote.mockResolvedValue([null, undefined]);
    const build = mocks.build.generateBuild({ status: "needs_review" });
    renderComponent({ build });

    await user.click(screen.getByRole("button", { name: /approve all/i }));

    expect(mockBulkCastVote).toHaveBeenCalledWith({ buildId: build.id, vote: "approve" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should reject all needs-review snapshots", async ({ user }) => {
    mockBulkCastVote.mockResolvedValue([null, undefined]);
    const build = mocks.build.generateBuild({ status: "needs_review" });
    renderComponent({ build });

    await user.click(screen.getByRole("button", { name: /^reject all$/i }));

    expect(mockBulkCastVote).toHaveBeenCalledWith({ buildId: build.id, vote: "reject" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should show an error toast if approving all fails", async ({ user }) => {
    mockBulkCastVote.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent({ build: mocks.build.generateBuild({ status: "needs_review" }) });

    await user.click(screen.getByRole("button", { name: /approve all/i }));

    expect(await screen.findByText("INTERNAL_SERVER_ERROR")).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("should show an error toast if rejecting all fails", async ({ user }) => {
    mockBulkCastVote.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent({ build: mocks.build.generateBuild({ status: "needs_review" }) });

    await user.click(screen.getByRole("button", { name: /^reject all$/i }));

    expect(await screen.findByText("INTERNAL_SERVER_ERROR")).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it.each(["queued", "processing"] as const)(
    "should show the cancel build button instead of the bulk actions when the build is %s",
    (status) => {
      renderComponent({ build: mocks.build.generateBuild({ status }) });

      expect(screen.getByRole("button", { name: /cancel build/i })).toBeVisible();
      expect(screen.queryByRole("button", { name: /approve all/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /reject all/i })).not.toBeInTheDocument();
    },
  );

  it("should not show the cancel build button once the build has finished", () => {
    renderComponent({ build: mocks.build.generateBuild({ status: "needs_review" }) });

    expect(screen.queryByRole("button", { name: /cancel build/i })).not.toBeInTheDocument();
  });

  it("should cancel the build when confirmed", async ({ user }) => {
    mockCancel.mockResolvedValue([null, { ok: true }]);
    const build = mocks.build.generateBuild({ status: "processing" });
    renderComponent({ build });

    await user.click(screen.getByRole("button", { name: /cancel build/i }));
    expect(await screen.findByRole("alertdialog", { name: /cancel build\?/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^cancel build$/i }));

    expect(mockCancel).toHaveBeenCalledWith({ buildId: build.id });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should not cancel the build when the confirmation is dismissed", async ({ user }) => {
    renderComponent({ build: mocks.build.generateBuild({ status: "processing" }) });

    await user.click(screen.getByRole("button", { name: /cancel build/i }));
    expect(await screen.findByRole("alertdialog", { name: /cancel build\?/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /keep building/i }));

    expect(mockCancel).not.toHaveBeenCalled();
  });

  it("should show an error toast if canceling fails", async ({ user }) => {
    mockCancel.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent({ build: mocks.build.generateBuild({ status: "processing" }) });

    await user.click(screen.getByRole("button", { name: /cancel build/i }));
    await user.click(screen.getByRole("button", { name: /^cancel build$/i }));

    expect(await screen.findByText("INTERNAL_SERVER_ERROR")).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("should not render the review or cancel actions when the build is canceled", () => {
    renderComponent({ build: mocks.build.generateBuild({ status: "canceled" }) });

    expect(screen.queryByRole("button", { name: /approve all/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject all/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancel build/i })).not.toBeInTheDocument();
  });

  it("should not render the review actions for a viewer", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "needs_review" }),
      canReview: false,
    });

    expect(screen.queryByRole("button", { name: /approve all/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject all/i })).not.toBeInTheDocument();
  });

  it("should not render the cancel action for a viewer", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "processing" }),
      canReview: false,
    });

    expect(screen.queryByRole("button", { name: /cancel build/i })).not.toBeInTheDocument();
  });
});
