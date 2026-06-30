import { dbClient } from "@ovr/db/client";
import type { DiffReviewStatus, DiffReviewVote } from "@ovr/db/schema";
import type { DiffReviewDbSchema } from "@ovr/db/repository/diffReviews";

import { finalizeBuild } from "@ovr/builds/builds";
import type { Result } from "@ovr/builds/types";

const computeReviewStatus = (
  votes: DiffReviewDbSchema[],
  requiredReviewerCount: number,
): DiffReviewStatus => {
  if (votes.some((vote) => vote.vote === "reject")) {
    return "rejected";
  }
  if (votes.filter((vote) => vote.vote === "approve").length >= requiredReviewerCount) {
    return "approved";
  }
  return "needs_review";
};

const recomputeReviewStatus = async (diffId: string): Promise<void> => {
  const diff = await dbClient.diffs.findById(diffId);
  if (!diff) {
    throw new Error(`Diff not found: ${diffId}`);
  }

  const snapshot = await dbClient.snapshots.findById(diff.snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot not found for diff: ${diffId}`);
  }

  const build = await dbClient.builds.findById(snapshot.buildId);
  if (!build) {
    throw new Error(`Build not found for snapshot: ${snapshot.id}`);
  }

  const project = await dbClient.projects.findById(build.projectId);
  if (!project) {
    throw new Error(`Project not found for build: ${build.id}`);
  }

  const votes = await dbClient.diffReviews.findByDiff(diffId);
  const reviewStatus = computeReviewStatus(votes, project.requiredReviewerCount);

  await dbClient.diffs.updateReviewStatus(diffId, reviewStatus);
  await finalizeBuild(build.id);
};

export const castVote = async (
  diffId: string,
  reviewerId: string,
  vote: DiffReviewVote,
): Promise<Result<void, "DIFF_NOT_FOUND" | "REVIEW_NOT_REQUIRED">> => {
  const diff = await dbClient.diffs.findById(diffId);
  if (!diff) {
    return { status: "error", error: "DIFF_NOT_FOUND" };
  }

  if (diff.reviewStatus === "not_required") {
    return { status: "error", error: "REVIEW_NOT_REQUIRED" };
  }

  await dbClient.diffReviews.upsertVote({ diffId, reviewerId, vote });
  await recomputeReviewStatus(diffId);

  return { status: "ok", data: undefined };
};

export const removeVote = async (
  diffId: string,
  reviewerId: string,
): Promise<Result<void, "DIFF_NOT_FOUND" | "REVIEW_NOT_REQUIRED">> => {
  const diff = await dbClient.diffs.findById(diffId);
  if (!diff) {
    return { status: "error", error: "DIFF_NOT_FOUND" };
  }

  if (diff.reviewStatus === "not_required") {
    return { status: "error", error: "REVIEW_NOT_REQUIRED" };
  }

  await dbClient.diffReviews.removeVote(diffId, reviewerId);
  await recomputeReviewStatus(diffId);

  return { status: "ok", data: undefined };
};

export const bulkCastVote = async (
  buildId: string,
  reviewerId: string,
  vote: DiffReviewVote,
): Promise<void> => {
  const diffs = await dbClient.diffs.findByBuild(buildId);
  const targetIds = diffs
    .filter((diff) => diff.reviewStatus !== "not_required")
    .map((diff) => diff.id);

  if (targetIds.length === 0) {
    return;
  }

  const build = await dbClient.builds.findById(buildId);
  if (!build) {
    throw new Error(`Build not found: ${buildId}`);
  }

  const project = await dbClient.projects.findById(build.projectId);
  if (!project) {
    throw new Error(`Project not found for build: ${buildId}`);
  }

  await dbClient.diffReviews.upsertVotes(targetIds.map((diffId) => ({ diffId, reviewerId, vote })));
  const votes = await dbClient.diffReviews.findByDiffs(targetIds);

  const idsByStatus = new Map<DiffReviewStatus, string[]>();
  for (const diffId of targetIds) {
    const diffVotes = votes.filter((diffReview) => diffReview.diffId === diffId);
    const reviewStatus = computeReviewStatus(diffVotes, project.requiredReviewerCount);
    idsByStatus.set(reviewStatus, [...(idsByStatus.get(reviewStatus) ?? []), diffId]);
  }

  await Promise.all(
    [...idsByStatus.entries()].map(([reviewStatus, ids]) =>
      dbClient.diffs.updateReviewStatusMany(ids, reviewStatus),
    ),
  );

  await finalizeBuild(buildId);
};
