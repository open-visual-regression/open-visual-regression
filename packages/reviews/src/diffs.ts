import { isDiffReviewable } from "@ovr/api/contracts/diffs";
import { hasNewerBuildOnBranch, updateBuildReviewStatus } from "@ovr/builds/builds";
import type { Result } from "@ovr/builds/types";
import { dbClient } from "@ovr/db/client";
import type { DiffReviewDbSchema } from "@ovr/db/repository/diffReviews";
import type { DiffReviewStatus, DiffReviewVote } from "@ovr/db/schema";

import {
  checkBuildReviewable,
  checkSnapshotReviewable,
  type BuildReviewBlockedReason,
  type SnapshotReviewBlockedReason,
} from "./reviewable";

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
  await updateBuildReviewStatus(build.id);
};

const findDiffWithParents = async (diffId: string) => {
  const diff = await dbClient.diffs.findById(diffId);
  if (!diff) {
    return null;
  }

  const snapshot = await dbClient.snapshots.findById(diff.snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot not found for diff: ${diffId}`);
  }

  const build = await dbClient.builds.findById(snapshot.buildId);
  if (!build) {
    throw new Error(`Build not found for snapshot: ${snapshot.id}`);
  }

  return { diff, snapshot, build };
};

export const castVote = async (
  diffId: string,
  reviewerId: string,
  vote: DiffReviewVote,
): Promise<Result<void, "DIFF_NOT_FOUND" | SnapshotReviewBlockedReason>> => {
  const found = await findDiffWithParents(diffId);
  if (!found) {
    return { status: "error", error: "DIFF_NOT_FOUND" };
  }

  const reviewable = await checkSnapshotReviewable(found.build, found.snapshot, found.diff);
  if (reviewable.status === "error") {
    return reviewable;
  }

  await dbClient.diffReviews.upsertVote({ diffId, reviewerId, vote });
  await recomputeReviewStatus(diffId);

  return { status: "ok", data: undefined };
};

export type RemoveVoteParams = {
  diffId: string;
  requesterId: string;
  requesterRole?: string | null;
  targetReviewerId?: string;
};

export const removeVote = async ({
  diffId,
  requesterId,
  requesterRole,
  targetReviewerId,
}: RemoveVoteParams): Promise<
  Result<void, "DIFF_NOT_FOUND" | "REVIEW_NOT_REQUIRED" | "FORBIDDEN" | "NOT_LATEST_ON_BRANCH">
> => {
  const reviewerId = targetReviewerId ?? requesterId;

  if (reviewerId !== requesterId && requesterRole !== "admin") {
    return { status: "error", error: "FORBIDDEN" };
  }

  const found = await findDiffWithParents(diffId);
  if (!found) {
    return { status: "error", error: "DIFF_NOT_FOUND" };
  }

  if (await hasNewerBuildOnBranch(found.build)) {
    return { status: "error", error: "NOT_LATEST_ON_BRANCH" };
  }

  if (!isDiffReviewable(found.diff.reviewStatus)) {
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
): Promise<Result<void, "BUILD_NOT_FOUND" | BuildReviewBlockedReason>> => {
  const build = await dbClient.builds.findById(buildId);
  if (!build) {
    return { status: "error", error: "BUILD_NOT_FOUND" };
  }

  const reviewable = await checkBuildReviewable(build);
  if (reviewable.status === "error") {
    return reviewable;
  }

  const diffs = await dbClient.diffs.findByBuild(buildId);
  const targetIds = diffs
    .filter((diff) => isDiffReviewable(diff.reviewStatus))
    .map((diff) => diff.id);

  if (targetIds.length === 0) {
    return { status: "ok", data: undefined };
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

  await updateBuildReviewStatus(buildId);

  return { status: "ok", data: undefined };
};
