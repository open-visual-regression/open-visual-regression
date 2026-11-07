import { dbClient } from "@ovr/db/client";
import { buildCommitUrl } from "@ovr/git-status/webCommitUrl";
import { findComparisonBaseline } from "@ovr/reviews/baselines";

type BaselineSource = { imagePath: string | null; buildId: string };

type Snapshot = {
  id: string;
  targetId: string;
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
};

type Build = { projectId: string; createdAt: string; baseBuildId: string | null };

export const toBaselineSnapshot = async (baselineSnapshot: BaselineSource, projectId: string) => {
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

// Snapshots that were never compared (skipped, errored, canceled) have no diff to carry their
// baseline, so fall back to what the build would have compared the target against: main at the
// build's merge base, or the project's latest baseline.
// A baseline set by a newer build than this one did not exist yet, so it is not shown.
export const findProjectBaselineSource = async (
  snapshot: Snapshot,
  build: Build,
): Promise<BaselineSource | null> => {
  const base = build.baseBuildId ? await dbClient.builds.findById(build.baseBuildId) : null;
  const baseline = await findComparisonBaseline(
    build.projectId,
    {
      browser: snapshot.browser,
      viewportWidth: snapshot.viewportWidth,
      viewportHeight: snapshot.viewportHeight,
    },
    snapshot.targetId,
    base ?? null,
  );

  if (!baseline.snapshotId || baseline.snapshotId === snapshot.id) {
    return null;
  }

  const baselineSnapshot = await dbClient.snapshots.findById(baseline.snapshotId);
  if (!baselineSnapshot) {
    return null;
  }

  const baselineBuild = await dbClient.builds.findById(baselineSnapshot.buildId);
  if (!baselineBuild || Date.parse(baselineBuild.createdAt) > Date.parse(build.createdAt)) {
    return null;
  }

  return baselineSnapshot;
};

export const getBaselineSnapshot = async (snapshot: Snapshot, build: Build) => {
  const row = await dbClient.diffs.findBySnapshotWithBaseline(snapshot.id);
  const source = row?.baselineSnapshot ?? (await findProjectBaselineSource(snapshot, build));

  return source ? toBaselineSnapshot(source, build.projectId) : null;
};
