import { dbClient } from "@ovr/db/client";
import { buildCommitUrl } from "@ovr/git-status/webCommitUrl";
import { findComparisonBase, findComparisonBaseline } from "@ovr/reviews/baselines";

type BaselineSource = { imagePath: string | null; buildId: string };

type Snapshot = {
  id: string;
  baselineSnapshotId: string | null;
  targetId: string;
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
};

type Build = { projectId: string; createdAt: string; branch: string; baseBuildId: string | null };

type Project = { gitMainBranch: string };

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

// Snapshots that never recorded a baseline (errored, canceled, or from before snapshots recorded
// one) fall back to what the build would have compared the target against.
// A baseline set by a newer build than this one did not exist yet, so it is not shown.
const findProjectBaselineSource = async (
  snapshot: Snapshot,
  build: Build,
  project: Project,
): Promise<BaselineSource | null> => {
  const baseline = await findComparisonBaseline(
    build.projectId,
    {
      browser: snapshot.browser,
      viewportWidth: snapshot.viewportWidth,
      viewportHeight: snapshot.viewportHeight,
    },
    snapshot.targetId,
    await findComparisonBase(build, project),
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

const findRecordedBaselineSource = async (snapshot: Snapshot) => {
  if (snapshot.baselineSnapshotId) {
    return (await dbClient.snapshots.findById(snapshot.baselineSnapshotId)) ?? null;
  }

  // Snapshots compared before snapshots recorded their baseline only have it on their diff.
  const row = await dbClient.diffs.findBySnapshotWithBaseline(snapshot.id);
  return row?.baselineSnapshot ?? null;
};

export const getBaselineSnapshot = async (snapshot: Snapshot, build: Build, project: Project) => {
  const source =
    (await findRecordedBaselineSource(snapshot)) ??
    (await findProjectBaselineSource(snapshot, build, project));

  return source ? toBaselineSnapshot(source, build.projectId) : null;
};
