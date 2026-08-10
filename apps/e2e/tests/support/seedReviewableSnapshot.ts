import type { SeedClient } from "../seed/client";
import { ingestStorybook } from "./ingest";

const FEATURE_BRANCH = "feature/e2e-review";

const LIST_LIMIT = 100;

export type ReviewableSnapshot = {
  projectId: string;
  buildId: string;
  snapshotId: string;
  targetTitle: string;
  targetName: string;
};

export const seedReviewableSnapshot = async (client: SeedClient): Promise<ReviewableSnapshot> => {
  const { projectId } = await client.projects.add({
    projectName: `E2E Review ${Date.now()}`,
    projectDescription: "Project used by the snapshot review E2E test",
    gitMainBranch: "main",
  });
  const { key } = await client.apiKeys.create({ projectId, name: "e2e-review" });

  const build = await ingestStorybook({ apiKey: key, branch: FEATURE_BRANCH });

  const { builds } = await client.builds.list({ projectIds: [projectId], limit: LIST_LIMIT });
  const buildId = builds.find((candidate) => candidate.commitSha === build.commitSha)?.id;
  if (!buildId) {
    throw new Error(`Could not find the ingested build for commit ${build.commitSha}`);
  }

  const { snapshots } = await client.snapshots.list({
    buildId,
    statuses: ["needs_review"],
    limit: LIST_LIMIT,
  });
  const snapshot = snapshots.at(-1);
  if (!snapshot) {
    throw new Error(
      `Ingest did not produce a needs_review snapshot (exit ${build.exitCode}): ${build.stderr}`,
    );
  }

  return {
    projectId,
    buildId,
    snapshotId: snapshot.id,
    targetTitle: snapshot.targetTitle,
    targetName: snapshot.targetName,
  };
};
