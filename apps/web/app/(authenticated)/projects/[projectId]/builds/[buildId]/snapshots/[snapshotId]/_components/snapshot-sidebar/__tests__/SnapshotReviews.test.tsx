import { useRouter } from "next/navigation";
import { vi } from "vitest";

import type { DiffReviewSchema } from "@ovr/api/contracts/diffs";
import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { SnapshotReviews } from "../SnapshotReviews";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockRemoveVote = vi.mocked(serverClient.diffs.removeVote);
const mockRefresh = vi.mocked(useRouter)().refresh;

const diffId = "019edfc7-e040-7492-86b2-ccfdc00cf6e1";

const review = (overrides: Partial<DiffReviewSchema> = {}): DiffReviewSchema => ({
  reviewerId: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  name: "Ada Lovelace",
  image: null,
  vote: "approve",
  reviewedAt: "2026-06-22T00:00:00.000Z",
  ...overrides,
});

describe("SnapshotReviews", () => {
  it("should render a message when there are no reviews", () => {
    render(<SnapshotReviews reviews={[]} requiredReviewerCount={1} diffId={diffId} />);

    expect(screen.getByText("no reviews yet")).toBeVisible();
  });

  it("should render each reviewer with their vote and summarize approvals against the required count", () => {
    render(
      <SnapshotReviews
        reviews={[
          review({ reviewerId: "a", name: "Ada Lovelace", vote: "approve" }),
          review({ reviewerId: "b", name: "Alan Turing", vote: "reject" }),
        ]}
        requiredReviewerCount={2}
        diffId={diffId}
      />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeVisible();
    expect(screen.getByText("approved")).toBeVisible();
    expect(screen.getByText("Alan Turing")).toBeVisible();
    expect(screen.getByText("rejected")).toBeVisible();
    expect(screen.getByText("1 of 2 required approvals")).toBeVisible();
  });

  it("should show a remove button for the current user's own review", () => {
    render(
      <SnapshotReviews
        reviews={[review({ reviewerId: "a", name: "Ada Lovelace" })]}
        requiredReviewerCount={1}
        diffId={diffId}
        currentUserId="a"
      />,
    );

    expect(screen.getByRole("button", { name: /remove your review/i })).toBeVisible();
  });

  it("should hide the remove button for another reviewer's review when the current user isn't an admin", () => {
    render(
      <SnapshotReviews
        reviews={[review({ reviewerId: "a", name: "Ada Lovelace" })]}
        requiredReviewerCount={1}
        diffId={diffId}
        currentUserId="someone-else"
      />,
    );

    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  it("should show a remove button for every review when the current user is an admin", () => {
    render(
      <SnapshotReviews
        reviews={[
          review({ reviewerId: "a", name: "Ada Lovelace" }),
          review({ reviewerId: "b", name: "Alan Turing" }),
        ]}
        requiredReviewerCount={2}
        diffId={diffId}
        currentUserId="someone-else"
        isAdmin
      />,
    );

    expect(screen.getAllByRole("button", { name: /remove review/i })).toHaveLength(2);
  });

  it("should hide remove buttons when there is no diff", () => {
    render(
      <SnapshotReviews
        reviews={[review({ reviewerId: "a", name: "Ada Lovelace" })]}
        requiredReviewerCount={1}
        diffId={null}
        currentUserId="a"
        isAdmin
      />,
    );

    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  it("should remove the caller's own review when clicked", async ({ user }) => {
    mockRemoveVote.mockResolvedValue([null, undefined]);
    render(
      <>
        <SnapshotReviews
          reviews={[review({ reviewerId: "a", name: "Ada Lovelace" })]}
          requiredReviewerCount={1}
          diffId={diffId}
          currentUserId="a"
        />
        <Toaster />
      </>,
    );

    await user.click(screen.getByRole("button", { name: /remove your review/i }));

    expect(mockRemoveVote).toHaveBeenCalledWith({ diffId, reviewerId: "a" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("should show an error toast if removing a review fails", async ({ user }) => {
    mockRemoveVote.mockResolvedValue([createORPCError("FORBIDDEN"), undefined]);
    render(
      <>
        <SnapshotReviews
          reviews={[review({ reviewerId: "a", name: "Ada Lovelace" })]}
          requiredReviewerCount={1}
          diffId={diffId}
          currentUserId="a"
        />
        <Toaster />
      </>,
    );

    await user.click(screen.getByRole("button", { name: /remove your review/i }));

    expect(await screen.findByText("FORBIDDEN")).toBeVisible();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
