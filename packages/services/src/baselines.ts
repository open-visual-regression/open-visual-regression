import { dbClient } from "@ovr/db/client";

export const getBaseline = (projectId: string, captureConfigurationId: string, targetId: string) =>
  dbClient.baselines.find(projectId, captureConfigurationId, targetId);

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

  await dbClient.baselines.upsert({
    projectId: project.id,
    captureConfigurationId: snapshot.captureConfigurationId,
    targetId: snapshot.targetId,
    snapshotId: snapshot.id,
    approvedBy: approverId,
  });
};
