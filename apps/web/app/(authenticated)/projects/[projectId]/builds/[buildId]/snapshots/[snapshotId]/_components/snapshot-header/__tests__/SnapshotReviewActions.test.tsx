import { vi } from "vitest";
import { Toaster } from "@ovr/ui/components/sonner";

import { describe, expect, it, render, screen, waitFor } from "@/test-utils";
import { serverClient } from "@/lib/router";
import { useRouter } from "next/navigation";
import { createORPCError } from "@/lib/testing/orpc";
import { SnapshotReviewActions, type SnapshotReviewActionsProps } from "../SnapshotReviewActions";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockCastVote = vi.mocked(serverClient.diffs.castVote);
const mockRefresh = vi.mocked(useRouter)().refresh;

const diffId = "019edfc7-e040-7492-86b2-ccfdc00cf6e3";

const renderComponent = (props: SnapshotReviewActionsProps) =>
  render(
    <>
      <SnapshotReviewActions {...props} />
      <Toaster />
    </>,
  );

describe("SnapshotReviewActions", () => {
  it("should approve the diff", async ({ user }) => {
    mockCastVote.mockResolvedValue([null, undefined]);
    renderComponent({ diffId });

    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    expect(mockCastVote).toHaveBeenCalledWith({ diffId, vote: "approve" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should reject the diff", async ({ user }) => {
    mockCastVote.mockResolvedValue([null, undefined]);
    renderComponent({ diffId });

    await user.click(screen.getByRole("button", { name: /^reject$/i }));

    expect(mockCastVote).toHaveBeenCalledWith({ diffId, vote: "reject" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should show an error toast if approving fails", async ({ user }) => {
    mockCastVote.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent({ diffId });

    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    expect(await screen.findByText("INTERNAL_SERVER_ERROR")).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("should show an error toast if rejecting fails", async ({ user }) => {
    mockCastVote.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent({ diffId });

    await user.click(screen.getByRole("button", { name: /^reject$/i }));

    expect(await screen.findByText("INTERNAL_SERVER_ERROR")).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
