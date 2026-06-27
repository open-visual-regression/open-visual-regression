import type { BuildStatus } from "@ovr/api/contracts/builds";
import type { BuildProcessingStatus, BuildReviewStatus } from "@ovr/db/schema";

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

  return "passed";
};
