import type { BuildStatus } from "@ovr/api/contracts/builds";
import type { StatusFilter } from "@ovr/db/repository/builds";
import type { BuildProcessingStatus, BuildReviewStatus } from "@ovr/db/schema";

const STATUS_FILTER_COMBOS: Record<BuildStatus, StatusFilter> = {
  queued: { processingStatus: "queued" },
  processing: { processingStatus: "processing" },
  error: { processingStatus: "error" },
  needs_review: { processingStatus: "success", reviewStatus: "needs_review" },
  rejected: { processingStatus: "success", reviewStatus: "rejected" },
  approved: { processingStatus: "success", reviewStatus: "approved" },
  unchanged: { processingStatus: "success", reviewStatus: "unchanged" },
  auto_approved: { processingStatus: "success", reviewStatus: "auto_approved" },
};

export const getBuildStatusFilters = (statuses: BuildStatus[]): StatusFilter[] =>
  statuses.map((status) => STATUS_FILTER_COMBOS[status]);

export const getBuildDisplayStatus = (build: {
  processingStatus: BuildProcessingStatus;
  reviewStatus: BuildReviewStatus;
}): BuildStatus => {
  if (build.processingStatus === "error") {
    return "error";
  }

  if (build.processingStatus === "queued") {
    return "queued";
  }

  if (build.processingStatus === "processing") {
    return "processing";
  }

  if (build.reviewStatus === "rejected") {
    return "rejected";
  }

  if (build.reviewStatus === "needs_review") {
    return "needs_review";
  }

  if (build.reviewStatus === "approved") {
    return "approved";
  }

  if (build.reviewStatus === "auto_approved") {
    return "auto_approved";
  }

  return "unchanged";
};
