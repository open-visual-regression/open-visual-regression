import { isDiffReviewable } from "@ovr/api/contracts/diffs";
import { checkIsLatestBuild } from "@ovr/builds/builds";
import type { Result } from "@ovr/builds/types";
import type { BuildDbSchema } from "@ovr/db/repository/builds";
import type { DiffDbSchema } from "@ovr/db/repository/diffs";
import type { SnapshotDbSchema } from "@ovr/db/repository/snapshots";

export type BuildReviewBlockedReason =
  | "NOT_SETTLED"
  | "BUILD_CANCELED"
  | "BUILD_FAILED"
  | "NOT_LATEST_ON_BRANCH";

export type SnapshotReviewBlockedReason =
  | "NOT_LATEST_ON_BRANCH"
  | "SNAPSHOT_FAILED"
  | "REVIEW_NOT_REQUIRED";

type ReviewCandidateBuild = Pick<
  NonNullable<BuildDbSchema>,
  "id" | "projectId" | "branch" | "createdAt" | "processingStatus"
>;

type ReviewableOptions = {
  // Callers that already know whether this is the latest build pass it in to skip the query.
  isLatestBuild?: boolean;
};

// Whether the build as a whole can be bulk-reviewed.
export const checkBuildReviewable = async (
  build: ReviewCandidateBuild,
  options: ReviewableOptions = {},
): Promise<Result<void, BuildReviewBlockedReason>> => {
  if (build.processingStatus === "queued" || build.processingStatus === "processing") {
    return { status: "error", error: "NOT_SETTLED" };
  }

  if (build.processingStatus === "canceled") {
    return { status: "error", error: "BUILD_CANCELED" };
  }

  if (build.processingStatus === "error") {
    return { status: "error", error: "BUILD_FAILED" };
  }

  if (!(await (options.isLatestBuild ?? checkIsLatestBuild(build)))) {
    return { status: "error", error: "NOT_LATEST_ON_BRANCH" };
  }

  return { status: "ok", data: undefined };
};

// Whether a single snapshot's diff can be voted on. Unlike bulk review, this is allowed while the
// build is still running, so reviewers can work through diffs as they land.
export const checkSnapshotReviewable = async (
  build: ReviewCandidateBuild,
  snapshot: Pick<SnapshotDbSchema, "status" | "hasRenderError">,
  diff: Pick<NonNullable<DiffDbSchema>, "processingStatus" | "reviewStatus"> | undefined,
  options: ReviewableOptions = {},
): Promise<Result<void, SnapshotReviewBlockedReason>> => {
  if (!(await (options.isLatestBuild ?? checkIsLatestBuild(build)))) {
    return { status: "error", error: "NOT_LATEST_ON_BRANCH" };
  }

  if (
    snapshot.status === "error" ||
    snapshot.hasRenderError ||
    diff?.processingStatus === "error"
  ) {
    return { status: "error", error: "SNAPSHOT_FAILED" };
  }

  if (!diff || !isDiffReviewable(diff.reviewStatus)) {
    return { status: "error", error: "REVIEW_NOT_REQUIRED" };
  }

  return { status: "ok", data: undefined };
};
