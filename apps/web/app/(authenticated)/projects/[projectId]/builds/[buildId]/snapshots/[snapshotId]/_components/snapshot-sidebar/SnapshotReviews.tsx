import type { DiffReviewSchema } from "@ovr/api/contracts/diffs";
import { Badge } from "@ovr/ui/components/badge";
import { Typography } from "@ovr/ui/components/typography";

import { Avatar } from "@/lib/components/avatar/Avatar";
import { formatRelativeDateTime } from "@/lib/utils/date";

export type SnapshotReviewsProps = {
  reviews: DiffReviewSchema[];
  requiredReviewerCount: number;
};

export const SnapshotReviews = ({ reviews, requiredReviewerCount }: SnapshotReviewsProps) => {
  if (reviews.length === 0) {
    return <Typography variant="body-muted">no reviews yet</Typography>;
  }

  const approvals = reviews.filter((review) => review.vote === "approve").length;

  return (
    <div className="flex flex-col gap-4">
      <Typography variant="caption">
        {approvals} of {requiredReviewerCount} required approvals
      </Typography>
      <ul className="flex flex-col gap-3">
        {reviews.map((review) => (
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
          </li>
        ))}
      </ul>
    </div>
  );
};
