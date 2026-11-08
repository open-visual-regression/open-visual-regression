import { dbClient } from "@ovr/db/client";
import type { BaselineKey } from "@ovr/db/repository/baselines";
import type { BuildDbSchema } from "@ovr/db/repository/builds";
import type { ProjectDbSchema } from "@ovr/db/repository/projects";
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

export const toBaselineKey = (key: BaselineKey): string =>
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
  keys: BaselineKey[],
  base: { createdAt: string } | null,
): Promise<Map<string, ComparisonBaseline>> => {
  const [latest, revisions] = await Promise.all([
    dbClient.baselines.findMany(projectId, keys),
    base ? dbClient.baselineRevisions.findFirstAfterMany(projectId, keys, base.createdAt) : [],
  ]);
  const latestByKey = new Map(latest.map((baseline) => [toBaselineKey(baseline), baseline]));
  const revisionByKey = new Map(revisions.map((revision) => [toBaselineKey(revision), revision]));

  return new Map(
    keys.map((key) => [
      toBaselineKey(key),
      resolveComparisonBaseline(
        latestByKey.get(toBaselineKey(key))?.snapshotId ?? null,
        revisionByKey.get(toBaselineKey(key)) ?? null,
      ),
    ]),
  );
};

// Branch builds compare against main as it was at their merge base, so changes main made
// since the branch was cut don't show up as the branch's own.
export const findComparisonBase = async (
  build: Pick<NonNullable<BuildDbSchema>, "branch" | "baseBuildId">,
  project: Pick<ProjectDbSchema, "gitMainBranch">,
) =>
  build.branch !== project.gitMainBranch && build.baseBuildId
    ? ((await dbClient.builds.findById(build.baseBuildId)) ?? null)
    : null;

export const findBuildComparisonBaselines = async (
  build: NonNullable<BuildDbSchema>,
  keys: BaselineKey[],
) => {
  if (keys.length === 0) {
    return new Map<string, ComparisonBaseline>();
  }

  const project = await dbClient.projects.findById(build.projectId);
  if (!project) {
    throw new Error(`Project not found for build: ${build.id}`);
  }

  return findComparisonBaselines(build.projectId, keys, await findComparisonBase(build, project));
};

export const findComparisonBaseline = async (
  projectId: string,
  viewport: Viewport,
  targetId: string,
  base: { createdAt: string } | null,
): Promise<ComparisonBaseline> => {
  const key = { ...viewport, targetId };
  const baselines = await findComparisonBaselines(projectId, [key], base);
  return baselines.get(toBaselineKey(key)) ?? { snapshotId: null, source: "latest" };
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
