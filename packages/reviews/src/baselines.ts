import { dbClient } from "@ovr/db/client";
import type { DiffReviewStatus } from "@ovr/db/schema";

type Viewport = { browser: string; viewportWidth: number; viewportHeight: number };

const CHANGED_REVIEW_STATUSES: ReadonlySet<DiffReviewStatus> = new Set([
  "auto_approved",
  "approved",
]);

export const getBaseline = (projectId: string, viewport: Viewport, targetId: string) =>
  dbClient.baselines.find({ projectId, ...viewport, targetId });

export type ComparisonBaseline = {
  snapshotId: string | null;
  // merge_base: main as it was at the build's merge base.
  // latest: main's latest, because there's no merge base or main hasn't changed the target since.
  // expired: the merge-base baseline was purged, so main's latest stands in for it.
  source: "merge_base" | "latest" | "expired";
};

export type ComparisonKey = Viewport & { targetId: string };

export const toComparisonKey = (key: ComparisonKey): string =>
  [key.targetId, key.browser, key.viewportWidth, key.viewportHeight].join(":");

const resolveComparisonBaseline = (
  latestSnapshotId: string | null,
  revision: { replacedExisting: boolean; previousSnapshotId: string | null } | null,
): ComparisonBaseline => {
  if (!revision) {
    return { snapshotId: latestSnapshotId, source: "latest" };
  }

  if (!revision.replacedExisting) {
    return { snapshotId: null, source: "merge_base" };
  }

  if (revision.previousSnapshotId) {
    return { snapshotId: revision.previousSnapshotId, source: "merge_base" };
  }

  return { snapshotId: latestSnapshotId, source: "expired" };
};

// What each target is compared against: main as it was at `base`, the main-branch build at the
// merge base. Only targets main changed after `base` differ from main's latest baseline, and
// the first of those changes records what the baseline was before it.
export const findComparisonBaselines = async (
  projectId: string,
  keys: ComparisonKey[],
  base: { createdAt: string } | null,
): Promise<Map<string, ComparisonBaseline>> => {
  const rows = await dbClient.baselines.findByKeysWithRevisionAfter(
    projectId,
    keys,
    base?.createdAt ?? null,
  );
  const rowByKey = new Map(rows.map((row) => [toComparisonKey(row.baseline), row]));

  // Main can have changed a target whose baseline is gone, e.g. deleted with its approver.
  const withoutBaseline = keys.filter((key) => !rowByKey.has(toComparisonKey(key)));
  const orphanedRevisions = base
    ? await dbClient.baselineRevisions.findFirstAfterByKeys(
        projectId,
        withoutBaseline,
        base.createdAt,
      )
    : [];
  const orphanedRevisionByKey = new Map(
    orphanedRevisions.map((revision) => [toComparisonKey(revision), revision]),
  );

  return new Map(
    keys.map((key) => {
      const row = rowByKey.get(toComparisonKey(key));
      return [
        toComparisonKey(key),
        resolveComparisonBaseline(
          row?.baseline.snapshotId ?? null,
          row?.revision ?? orphanedRevisionByKey.get(toComparisonKey(key)) ?? null,
        ),
      ];
    }),
  );
};

// Branch builds compare against main as it was at their merge base, so changes main made
// since the branch was cut don't show up as the branch's own.
export const findComparisonBase = async (
  build: { branch: string; baseBuildId: string | null },
  project: { gitMainBranch: string },
) =>
  build.branch !== project.gitMainBranch && build.baseBuildId
    ? ((await dbClient.builds.findById(build.baseBuildId)) ?? null)
    : null;

export const findComparisonBaseline = async (
  projectId: string,
  viewport: Viewport,
  targetId: string,
  base: { createdAt: string } | null,
): Promise<ComparisonBaseline> => {
  const key = { ...viewport, targetId };
  const baselines = await findComparisonBaselines(projectId, [key], base);
  return baselines.get(toComparisonKey(key)) ?? { snapshotId: null, source: "latest" };
};

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
        previousSnapshotId: snapshot.baselineSnapshotId,
        replacedExisting: snapshot.baselineSnapshotId !== null,
        createdAt: build.createdAt,
      },
      tx,
    );
  });
};
