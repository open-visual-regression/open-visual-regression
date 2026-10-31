import { dbClient } from "@ovr/db/client";
import { buildCommitUrl } from "@ovr/git-status/webCommitUrl";

type BaselineSource = { imagePath: string | null; buildId: string };

type Snapshot = {
  id: string;
  targetId: string;
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
};

type Build = { projectId: string; createdAt: string };

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
// baseline, so fall back to the project's baseline for the same story, browser, and viewport.
// A baseline set by a newer build than this one did not exist yet, so it is not shown.
const findProjectBaselineSource = async (
  snapshot: Snapshot,
  build: Build,
): Promise<BaselineSource | null> => {
  const baseline = await dbClient.baselines.find({
    projectId: build.projectId,
    targetId: snapshot.targetId,
    browser: snapshot.browser,
    viewportWidth: snapshot.viewportWidth,
    viewportHeight: snapshot.viewportHeight,
  });

  if (!baseline || baseline.snapshotId === snapshot.id) {
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
