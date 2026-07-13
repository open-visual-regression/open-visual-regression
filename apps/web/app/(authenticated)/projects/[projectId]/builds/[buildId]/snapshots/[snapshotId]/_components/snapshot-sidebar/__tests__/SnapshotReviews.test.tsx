import type { DiffReviewSchema } from "@ovr/api/contracts/diffs";

import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotReviews } from "../SnapshotReviews";

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
    render(<SnapshotReviews reviews={[]} requiredReviewerCount={1} />);

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
      />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeVisible();
    expect(screen.getByText("approved")).toBeVisible();
    expect(screen.getByText("Alan Turing")).toBeVisible();
    expect(screen.getByText("rejected")).toBeVisible();
    expect(screen.getByText("1 of 2 required approvals")).toBeVisible();
  });
});
