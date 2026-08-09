import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";
import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { BuildHeader, type BuildHeaderProps } from "../BuildHeader";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockBulkCastVote = vi.mocked(serverClient.diffs.bulkCastVote);
const mockCancel = vi.mocked(serverClient.builds.cancel);
const mockRebuild = vi.mocked(serverClient.builds.rebuild);
const mockRefresh = vi.mocked(useRouter)().refresh;
const mockPush = vi.mocked(useRouter)().push;

const renderComponent = ({
  build = mocks.build.generateBuild(),
  storybookHref = null,
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
  canManageBuild = true,
}: Partial<BuildHeaderProps> = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <BuildHeader
        build={build}
        snapshotCounts={snapshotCounts}
        storybookHref={storybookHref}
        canManageBuild={canManageBuild}
      />
      <Toaster />
    </QueryClientProvider>,
  );
};

describe("BuildHeader", () => {
  it("should render the SegmentedProgress segments with the correct counts", () => {
    renderComponent({ build: mocks.build.generateBuild({ status: "needs_review" }) });

    expect(screen.getByText("10 snapshots")).toBeVisible();
    expect(screen.getByRole("listitem", { name: "3 unchanged" })).toBeVisible();
    expect(screen.getByRole("listitem", { name: "2 needs review" })).toBeVisible();
    expect(screen.getByRole("listitem", { name: "1 error" })).toBeVisible();
    expect(screen.getByRole("listitem", { name: "4 queued" })).toBeVisible();
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

  it("should show approve all as disabled and labeled when the build is already approved", () => {
    renderComponent({ build: mocks.build.generateBuild({ status: "approved" }) });

    expect(screen.getByRole("button", { name: /^approved$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^reject all$/i })).toBeEnabled();
  });

  it("should show the error alert when the build has an error message", () => {
    renderComponent({
      build: mocks.build.generateBuild({
        status: "error",
        errorMessage: "Build failed: unable to connect to the test runner.",
      }),
      snapshotCounts: {
        unchanged: 0,
        auto_approved: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 0,
        canceled: 0,
        queued: 0,
        processing: 0,
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Build failed: unable to connect to the test runner.",
    );
  });

  it("should hide the bulk review actions when the build has processing errors, even with reviewable snapshots", () => {
    renderComponent({
      build: mocks.build.generateBuild({
        status: "error",
        errorMessage: "One or more snapshots failed to diff against their baseline",
      }),
      snapshotCounts: {
        unchanged: 0,
        auto_approved: 0,
        approved: 0,
        needs_review: 30,
        rejected: 0,
        error: 3,
        canceled: 0,
        queued: 0,
        processing: 0,
      },
    });

    expect(screen.queryByRole("button", { name: /approve all/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject all/i })).not.toBeInTheDocument();
  });

  it("should not show the error alert when the build has no error message", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "needs_review", errorMessage: null }),
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should show reject all as disabled and labeled when the build was rejected", () => {
    renderComponent({ build: mocks.build.generateBuild({ status: "rejected" }) });

    expect(screen.getByRole("button", { name: /^rejected$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^approve all$/i })).toBeEnabled();
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

  it("should not show the rebuild button when the build is not rebuildable", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "needs_review", isRebuildable: false }),
    });

    expect(screen.queryByRole("button", { name: /^rebuild$/i })).not.toBeInTheDocument();
  });

  it("should not show the rebuild button while the build is still queued or processing", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "processing", isRebuildable: true }),
    });

    expect(screen.queryByRole("button", { name: /^rebuild$/i })).not.toBeInTheDocument();
  });

  it("should show the rebuild button alongside the review actions", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "needs_review", isRebuildable: true }),
    });

    expect(screen.getByRole("button", { name: /^rebuild$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /approve all/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^reject all$/i })).toBeVisible();
  });

  it("should show the rebuild button for a rebuildable build with a processing error, even without reviewable snapshots", () => {
    renderComponent({
      build: mocks.build.generateBuild({
        status: "error",
        errorMessage: "One or more snapshots failed to diff against their baseline",
        isRebuildable: true,
      }),
      snapshotCounts: {
        unchanged: 0,
        auto_approved: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 3,
        canceled: 0,
        queued: 0,
        processing: 0,
      },
    });

    expect(screen.getByRole("button", { name: /^rebuild$/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /approve all/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject all/i })).not.toBeInTheDocument();
  });

  it("should show the rebuild button for a rebuildable canceled build", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "canceled", isRebuildable: true }),
    });

    expect(screen.getByRole("button", { name: /^rebuild$/i })).toBeVisible();
  });

  it("should rebuild the build and go to the new build's page when confirmed", async ({ user }) => {
    mockRebuild.mockResolvedValue([null, { buildId: "019edfc7-e040-7492-86b2-ccfdc00cf6e2" }]);
    const build = mocks.build.generateBuild({ status: "needs_review", isRebuildable: true });
    renderComponent({ build });

    await user.click(screen.getByRole("button", { name: /^rebuild$/i }));
    expect(await screen.findByRole("alertdialog", { name: /rebuild\?/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^rebuild$/i }));

    expect(mockRebuild).toHaveBeenCalledWith({ buildId: build.id });
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        `/projects/${build.project.id}/builds/019edfc7-e040-7492-86b2-ccfdc00cf6e2`,
      ),
    );
  });

  it("should not rebuild the build when the confirmation is dismissed", async ({ user }) => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "needs_review", isRebuildable: true }),
    });

    await user.click(screen.getByRole("button", { name: /^rebuild$/i }));
    expect(await screen.findByRole("alertdialog", { name: /rebuild\?/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /keep as-is/i }));

    expect(mockRebuild).not.toHaveBeenCalled();
  });

  it("should show an inline error if rebuilding fails", async ({ user }) => {
    mockRebuild.mockResolvedValue([createORPCError("CONFLICT"), undefined]);
    renderComponent({
      build: mocks.build.generateBuild({ status: "needs_review", isRebuildable: true }),
    });

    await user.click(screen.getByRole("button", { name: /^rebuild$/i }));
    await user.click(screen.getByRole("button", { name: /^rebuild$/i }));

    expect(await screen.findByText("CONFLICT")).toBeVisible();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should show who canceled the build", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "canceled", canceledBy: "Jordan Lee" }),
    });

    expect(screen.getByText(/canceled by Jordan Lee/i)).toBeVisible();
  });

  it("should attribute the cancellation to the system when no user canceled it", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "canceled", canceledBy: null }),
    });

    expect(screen.getByText(/canceled by the system/i)).toBeVisible();
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
      canManageBuild: false,
    });

    expect(screen.queryByRole("button", { name: /approve all/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject all/i })).not.toBeInTheDocument();
  });

  it("should not render the cancel action for a viewer", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "processing" }),
      canManageBuild: false,
    });

    expect(screen.queryByRole("button", { name: /cancel build/i })).not.toBeInTheDocument();
  });

  it("should not render the rebuild action for a viewer", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "needs_review", isRebuildable: true }),
      canManageBuild: false,
    });

    expect(screen.queryByRole("button", { name: /^rebuild$/i })).not.toBeInTheDocument();
  });

  it("should render the view storybook link when a storybook build exists", () => {
    renderComponent({ storybookHref: "/api/storybook/mock-build/index.html" });

    expect(screen.getByRole("link", { name: /view storybook/i })).toBeVisible();
  });

  it("should not render the view storybook link when there is no storybook build", () => {
    renderComponent({ storybookHref: null });

    expect(screen.queryByRole("link", { name: /view storybook/i })).not.toBeInTheDocument();
  });

  it("should link the commit sha to the provider's commit page when a git integration is configured", () => {
    renderComponent({
      build: mocks.build.generateBuild({
        commitSha: "abc1234def",
        commitUrl: "https://github.com/acme/web/commit/abc1234def",
      }),
    });

    expect(screen.getByRole("link", { name: /abc1234/i })).toHaveAttribute(
      "href",
      "https://github.com/acme/web/commit/abc1234def",
    );
  });

  it("should render the commit sha as plain text when there is no git integration", () => {
    renderComponent({
      build: mocks.build.generateBuild({ commitSha: "abc1234def", commitUrl: null }),
    });

    expect(screen.getByText(/abc1234/i)).toBeVisible();
    expect(screen.queryByRole("link", { name: /abc1234/i })).not.toBeInTheDocument();
  });
});
