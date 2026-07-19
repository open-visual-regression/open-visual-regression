import type { BuildStatus, GetBuildStatusOutput } from "@ovr/api/contracts/builds";
import type { StatusFilter } from "@ovr/db/repository/builds";
import type { BuildProcessingStatus, BuildReviewStatus } from "@ovr/db/schema";

const STATUS_FILTER_COMBOS: Record<BuildStatus, StatusFilter> = {
  queued: { processingStatus: "queued" },
  processing: { processingStatus: "processing" },
  error: { processingStatus: "error" },
  canceled: { processingStatus: "canceled" },
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

  if (build.processingStatus === "canceled") {
    return "canceled";
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

// A build stays streamable while it can still change: queued/processing move forward,
// and needs_review can flip once reviewers vote. Everything else is a settled outcome.
const NON_TERMINAL_BUILD_STATUSES = new Set<BuildStatus>(["queued", "processing", "needs_review"]);

export const isTerminalBuildStatus = (status: BuildStatus): boolean =>
  !NON_TERMINAL_BUILD_STATUSES.has(status);

type BuildStatusSource = {
  id: string;
  projectId: string;
  processingStatus: BuildProcessingStatus;
  reviewStatus: BuildReviewStatus;
  errorMessage: string | null;
};

export const getBuildStatusOutput = (build: BuildStatusSource): GetBuildStatusOutput => {
  const status = getBuildDisplayStatus(build);

  if (status === "needs_review") {
    const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
    return {
      status,
      reviewUrl: `${baseUrl}/projects/${build.projectId}/builds/${build.id}`,
    };
  }

  if (status === "error") {
    return { status, errorMessage: build.errorMessage ?? undefined };
  }

  return { status };
};
