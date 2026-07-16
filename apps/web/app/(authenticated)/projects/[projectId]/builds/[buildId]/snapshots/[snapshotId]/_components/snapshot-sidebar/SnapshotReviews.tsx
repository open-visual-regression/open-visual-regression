import type { DiffReviewSchema } from "@ovr/api/contracts/diffs";
import { Badge } from "@ovr/ui/components/badge";
import { Typography } from "@ovr/ui/components/typography";

import { Avatar } from "@/lib/components/avatar/Avatar";
import { formatRelativeDateTime } from "@/lib/utils/date";

import { RemoveReviewButton } from "./RemoveReviewButton";

export type SnapshotReviewsProps = {
  reviews: DiffReviewSchema[];
  requiredReviewerCount: number;
  diffId: string | null;
  currentUserId?: string;
  role?: string | null;
};

export const SnapshotReviews = ({
  reviews,
  requiredReviewerCount,
  diffId,
  currentUserId,
  role,
}: SnapshotReviewsProps) => {
  if (reviews.length === 0) {
    return <Typography variant="body-muted">no reviews yet</Typography>;
  }

  const approvals = reviews.filter((review) => review.vote === "approve").length;
  const canRemoveAny =
    diffId !== null &&
    (role === "admin" || reviews.some((review) => review.reviewerId === currentUserId));

  return (
    <div className="flex flex-col gap-4">
      <Typography variant="caption">
        {approvals} of {requiredReviewerCount} required approvals
      </Typography>
      <ul className="flex flex-col gap-3">
        {reviews.map((review) => {
          const isOwnReview = review.reviewerId === currentUserId;
          const canRemove = diffId !== null && (isOwnReview || role === "admin");

          return (
            <li key={review.reviewerId} className="flex items-center gap-3">
              <Avatar name={review.name} image={review.image} />
              <div className="flex min-w-0 flex-1 flex-col">
                <Typography variant="body" className="truncate">
                  {review.name}
                </Typography>
                <Typography variant="caption">
                  {formatRelativeDateTime(new Date(review.reviewedAt))}
                </Typography>
              </div>
              <Badge color={review.vote === "approve" ? "green" : "red"}>
                {review.vote === "approve" ? "approved" : "rejected"}
              </Badge>
              {canRemoveAny ? (
                <div
                  data-testid="remove-review-slot"
                  className="flex size-7 shrink-0 items-center justify-center"
                >
                  {canRemove ? (
                    <RemoveReviewButton
                      diffId={diffId}
                      reviewerId={review.reviewerId}
                      label={isOwnReview ? "remove your review" : "remove review"}
                    />
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
