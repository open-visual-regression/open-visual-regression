import { dbClient } from "@ovr/db/client";
import type { DiffReviewStatus } from "@ovr/db/schema";

type Viewport = { browser: string; viewportWidth: number; viewportHeight: number };

const CHANGED_REVIEW_STATUSES: ReadonlySet<DiffReviewStatus> = new Set([
  "auto_approved",
  "approved",
]);

export const getBaseline = (projectId: string, viewport: Viewport, targetId: string) =>
  dbClient.baselines.find({ projectId, ...viewport, targetId });

export const promoteBaseline = async (diffId: string, approverId: string): Promise<void> => {
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

  if (build.branch !== project.gitMainBranch) {
    return;
  }

  const key = {
    projectId: project.id,
    browser: snapshot.browser,
    viewportWidth: snapshot.viewportWidth,
    viewportHeight: snapshot.viewportHeight,
    targetId: snapshot.targetId,
  };

  await dbClient.transaction(async (tx) => {
    const baseline = await dbClient.baselines.upsert(
      { ...key, snapshotId: snapshot.id, approvedBy: approverId },
      tx,
    );

    // Only record changes, so unchanged targets don't add a row on every main build.
    if (!baseline || !CHANGED_REVIEW_STATUSES.has(diff.reviewStatus)) {
      return;
    }

    await dbClient.baselineRevisions.create(
      {
        ...key,
        buildId: build.id,
        previousSnapshotId: diff.baselineSnapshotId,
        replacedExisting: diff.baselineSnapshotId !== null,
        createdAt: build.createdAt,
      },
      tx,
    );
  });
};
