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
const mockRefresh = vi.mocked(useRouter)().refresh;

const renderComponent = ({
  build = mocks.build.generateBuild(),
  storybookHref = null,
  snapshotCounts = {
    passed: 3,
    approved: 0,
    needs_review: 2,
    rejected: 0,
    error: 1,
    queued: 4,
    processing: 0,
  },
}: Partial<BuildHeaderProps> = {}) =>
  render(
    <>
      <BuildHeader build={build} snapshotCounts={snapshotCounts} storybookHref={storybookHref} />
      <Toaster />
    </>,
  );

describe("BuildHeader", () => {
  it("should render the SegmentedProgress segments with the correct counts", () => {
    renderComponent({ build: mocks.build.generateBuild({ status: "needs_review" }) });

    expect(screen.getByText("10 snapshots")).toBeVisible();
    expect(screen.getByRole("listitem", { name: "3 passed" })).toBeVisible();
    expect(screen.getByRole("listitem", { name: "2 needs review" })).toBeVisible();
    expect(screen.getByRole("listitem", { name: "1 error" })).toBeVisible();
    expect(screen.getByRole("listitem", { name: "4 queued" })).toBeVisible();
  });

  it("should disable both bulk actions when there are no reviewable snapshots", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "needs_review" }),
      snapshotCounts: {
        passed: 3,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 1,
        queued: 4,
        processing: 0,
      },
    });

    expect(screen.getByRole("button", { name: /approve all/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reject all/i })).toBeDisabled();
  });

  it("should enable reject all when every reviewable snapshot is already approved", () => {
    renderComponent({
      build: mocks.build.generateBuild({ status: "approved" }),
      snapshotCounts: {
        passed: 3,
        approved: 2,
        needs_review: 0,
        rejected: 0,
        error: 1,
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
        passed: 3,
        approved: 1,
        needs_review: 0,
        rejected: 1,
        error: 1,
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
        passed: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 0,
        queued: 0,
        processing: 0,
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Build failed: unable to connect to the test runner.",
    );
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

  it("should render the view storybook link when a storybook build exists", () => {
    renderComponent({ storybookHref: "/api/storybook/mock-build/index.html" });

    expect(screen.getByRole("link", { name: /view storybook/i })).toBeVisible();
  });

  it("should not render the view storybook link when there is no storybook build", () => {
    renderComponent({ storybookHref: null });

    expect(screen.queryByRole("link", { name: /view storybook/i })).not.toBeInTheDocument();
  });
});
