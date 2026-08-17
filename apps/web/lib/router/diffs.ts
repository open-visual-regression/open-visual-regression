"use server";

import { ORPCError } from "@orpc/client";

import { dbClient } from "@ovr/db/client";
import { buildCommitUrl } from "@ovr/git-status/webCommitUrl";
import {
  bulkCastVote as bulkCastVoteService,
  castVote as castVoteService,
  removeVote as removeVoteService,
} from "@ovr/reviews/diffs";

import {
  authenticatedMiddleware,
  organizationDiffMiddleware,
  organizationSnapshotMiddleware,
  reviewerMiddleware,
} from "./middleware";
import { os } from "./os";

const throwOnError = (error: "DIFF_NOT_FOUND" | "REVIEW_NOT_REQUIRED" | "FORBIDDEN"): never => {
  if (error === "DIFF_NOT_FOUND") {
    throw new ORPCError("NOT_FOUND");
  }
  if (error === "FORBIDDEN") {
    throw new ORPCError("FORBIDDEN");
  }
  throw new ORPCError("BAD_REQUEST");
};

const buildBaselineSnapshot = async (
  baselineSnapshot: { imagePath: string | null; buildId: string },
  projectId: string,
) => {
  const [baselineBuild, gitIntegration] = await Promise.all([
    dbClient.builds.findById(baselineSnapshot.buildId),
    dbClient.gitIntegrations.findByProject(projectId),
  ]);

  if (!baselineBuild) {
    return { imagePath: baselineSnapshot.imagePath, commitSha: null, commitUrl: null };
  }

  return {
    imagePath: baselineSnapshot.imagePath,
    commitSha: baselineBuild.commitSha,
    commitUrl: gitIntegration
      ? buildCommitUrl(
          gitIntegration.provider,
          gitIntegration.repoIdentifier,
          baselineBuild.commitSha,
        )
      : null,
  };
};

export const castVote = os.diffs.castVote
  .use(authenticatedMiddleware)
  .use(reviewerMiddleware)
  .handler(async ({ input, context }) => {
    const result = await castVoteService(input.diffId, context.user.id, input.vote);

    if (result.status === "error") {
      throwOnError(result.error);
    }
  })
  .actionable();

export const removeVote = os.diffs.removeVote
  .use(authenticatedMiddleware)
  .use(reviewerMiddleware)
  .use(organizationDiffMiddleware)
  .handler(async ({ input, context }) => {
    const result = await removeVoteService({
      diffId: input.diffId,
      requesterId: context.user.id,
      requesterRole: context.user.role,
      targetReviewerId: input.reviewerId,
    });

    if (result.status === "error") {
      throwOnError(result.error);
    }
  })
  .actionable();

export const bulkCastVote = os.diffs.bulkCastVote
  .use(authenticatedMiddleware)
  .use(reviewerMiddleware)
  .handler(async ({ input, context }) => {
    await bulkCastVoteService(input.buildId, context.user.id, input.vote);
  })
  .actionable();

export const getOne = os.diffs.getOne
  .use(authenticatedMiddleware)
  .use(organizationSnapshotMiddleware)
  .handler(async ({ context }) => {
    const row = await dbClient.diffs.findBySnapshotWithBaseline(context.snapshot.id);

    if (!row) {
      return { diff: null };
    }

    const baselineSnapshot = row.baselineSnapshot
      ? await buildBaselineSnapshot(row.baselineSnapshot, context.project.id)
      : null;

    return {
      diff: {
        id: row.diff.id,
        processingStatus: row.diff.processingStatus,
        reviewStatus: row.diff.reviewStatus,
        diffImagePath: row.diff.diffImagePath,
        pixelDiffCount: row.diff.pixelDiffCount,
        diffPercent: row.diff.diffPercent,
        baselineSnapshot,
      },
    };
  })
  .actionable();

export const listReviews = os.diffs.listReviews
  .use(authenticatedMiddleware)
  .use(organizationSnapshotMiddleware)
  .handler(async ({ context }) => {
    const diff = await dbClient.diffs.findBySnapshot(context.snapshot.id);

    const reviews = diff
      ? await dbClient.diffReviews.findByDiff(diff.id, { withReviewers: true })
      : [];

    return {
      reviews: reviews.map((review) => ({
        reviewerId: review.reviewer.id,
        name: review.reviewer.name,
        image: review.reviewer.image,
        vote: review.vote,
        reviewedAt: review.reviewedAt,
      })),
      requiredReviewerCount: context.project.requiredReviewerCount,
    };
  })
  .actionable();
