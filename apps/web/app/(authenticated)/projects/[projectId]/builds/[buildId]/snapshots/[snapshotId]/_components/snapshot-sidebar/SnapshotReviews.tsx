import type { DiffReviewSchema } from "@ovr/api/contracts/diffs";
import { Badge } from "@ovr/ui/components/badge";
import { Typography } from "@ovr/ui/components/typography";

import { formatRelativeDateTime } from "@/lib/utils/date";
import { getMonogram } from "@/lib/utils/monogram";

export type SnapshotReviewsProps = {
  reviews: DiffReviewSchema[];
  requiredReviewerCount: number;
};

const ReviewerAvatar = ({ name, image }: Pick<DiffReviewSchema, "name" | "image">) => {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="size-7 shrink-0 rounded-sm border border-ovr-border object-cover"
      />
    );
  }

  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-ovr-border text-badge font-semibold uppercase">
      {getMonogram(name)}
    </span>
  );
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
            <ReviewerAvatar name={review.name} image={review.image} />
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
