import { dbClient } from "@ovr/db/client";
import type { DiffReviewVote } from "@ovr/db/schema";

import { finalizeBuild } from "./builds";
import type { Result } from "./types";

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

  const reviewStatus = (() => {
    if (votes.some((vote) => vote.vote === "reject")) {
      return "rejected";
    }
    if (votes.filter((vote) => vote.vote === "approve").length >= project.requiredReviewerCount) {
      return "approved";
    }
    return "awaiting_review";
  })();

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

  for (const diff of diffs) {
    if (diff.reviewStatus === "awaiting_review") {
      await castVote(diff.id, reviewerId, vote);
    }
  }
};
