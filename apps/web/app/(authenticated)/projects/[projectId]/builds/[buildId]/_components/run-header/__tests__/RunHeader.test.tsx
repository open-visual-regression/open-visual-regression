import { vi } from "vitest";
import { Toaster } from "@ovr/ui/components/sonner";

import { describe, expect, it, render, screen, waitFor } from "@/test-utils";
import { serverClient } from "@/lib/router";
import { useRouter } from "next/navigation";
import { mocks } from "@ovr/mocks";
import { createORPCError } from "@/lib/testing/orpc";
import { RunHeader, type RunHeaderProps } from "../RunHeader";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockBulkCastVote = vi.mocked(serverClient.diffs.bulkCastVote);
const mockRefresh = vi.mocked(useRouter)().refresh;

const renderComponent = (props: RunHeaderProps) =>
  render(
    <>
      <RunHeader {...props} />
      <Toaster />
    </>,
  );

describe("RunHeader", () => {
  it("should render the SegmentedProgress segments with the correct counts", () => {
    const build = mocks.build.generateBuild();
    renderComponent({ build, snapshotCounts: { pass: 3, changed: 2, fail: 1, pending: 4 } });

    expect(screen.getByText("10 snapshots")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
    expect(screen.getByText("pass")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("changed")).toBeVisible();
    expect(screen.getByText("1")).toBeVisible();
    expect(screen.getByText("failed")).toBeVisible();
    expect(screen.getByText("4")).toBeVisible();
    expect(screen.getByText("pending")).toBeVisible();
  });

  it("should disable both bulk actions when there are no changed snapshots", () => {
    const build = mocks.build.generateBuild();
    renderComponent({ build, snapshotCounts: { pass: 3, changed: 0, fail: 1, pending: 4 } });

    expect(screen.getByRole("button", { name: /approve all/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reject all/i })).toBeDisabled();
  });

  it("should approve all changed snapshots", async ({ user }) => {
    mockBulkCastVote.mockResolvedValue([null, undefined]);
    const build = mocks.build.generateBuild();
    renderComponent({ build, snapshotCounts: { pass: 3, changed: 2, fail: 1, pending: 4 } });

    await user.click(screen.getByRole("button", { name: /approve all/i }));

    expect(mockBulkCastVote).toHaveBeenCalledWith({ buildId: build.id, vote: "approve" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should reject all changed snapshots", async ({ user }) => {
    mockBulkCastVote.mockResolvedValue([null, undefined]);
    const build = mocks.build.generateBuild();
    renderComponent({ build, snapshotCounts: { pass: 3, changed: 2, fail: 1, pending: 4 } });

    await user.click(screen.getByRole("button", { name: /^reject all$/i }));

    expect(mockBulkCastVote).toHaveBeenCalledWith({ buildId: build.id, vote: "reject" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should show an error toast if approving all fails", async ({ user }) => {
    mockBulkCastVote.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    const build = mocks.build.generateBuild();
    renderComponent({ build, snapshotCounts: { pass: 3, changed: 2, fail: 1, pending: 4 } });

    await user.click(screen.getByRole("button", { name: /approve all/i }));

    expect(await screen.findByText("INTERNAL_SERVER_ERROR")).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("should show an error toast if rejecting all fails", async ({ user }) => {
    mockBulkCastVote.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    const build = mocks.build.generateBuild();
    renderComponent({ build, snapshotCounts: { pass: 3, changed: 2, fail: 1, pending: 4 } });

    await user.click(screen.getByRole("button", { name: /^reject all$/i }));

    expect(await screen.findByText("INTERNAL_SERVER_ERROR")).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
