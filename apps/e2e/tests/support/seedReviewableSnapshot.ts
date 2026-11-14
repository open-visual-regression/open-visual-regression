import type { SeedClient } from "../seed/client";
import { ingestStorybook, smallStorybookDir } from "./ingest";

const FEATURE_BRANCH = "feature/e2e-review";

const LIST_LIMIT = 100;

export type ReviewableSnapshot = {
  projectId: string;
  apiKey: string;
  buildId: string;
  snapshotId: string;
  targetTitle: string;
  targetName: string;
  browser: string;
  viewportName: string;
};

// Ingests a few stories by default; pass the full Storybook for a build long enough to scroll.
export const seedReviewableSnapshot = async (
  client: SeedClient,
  { storybookDir }: { storybookDir?: string } = {},
): Promise<ReviewableSnapshot> => {
  const { projectId } = await client.projects.add({
    projectName: `E2E Review ${Date.now()}`,
    projectDescription: "Project used by the snapshot review E2E test",
    gitMainBranch: "main",
  });
  const { key } = await client.apiKeys.create({ projectId, name: "e2e-review" });

  const build = await ingestStorybook({
    apiKey: key,
    branch: FEATURE_BRANCH,
    storybookDir: storybookDir ?? (await smallStorybookDir()),
  });

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
  const snapshot = snapshots[0];
  if (!snapshot) {
    throw new Error(
      `Ingest did not produce a needs_review snapshot (exit ${build.exitCode}): ${build.stderr}`,
    );
  }

  return {
    projectId,
    apiKey: key,
    buildId,
    snapshotId: snapshot.id,
    targetTitle: snapshot.targetTitle,
    targetName: snapshot.targetName,
    browser: snapshot.browser,
    viewportName: snapshot.viewportName,
  };
};
