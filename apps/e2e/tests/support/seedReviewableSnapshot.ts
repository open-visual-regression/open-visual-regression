import type { Readable } from "node:stream";

import { storage } from "@ovr/storage";

import type { SeedClient } from "../seed/client";
import { ingestStorybook } from "./ingest";

// Not the project's gitMainBranch, so captures are reviewed rather than promoted.
const FEATURE_BRANCH = "feature/e2e-review";

const SNAPSHOT_LIST_LIMIT = 100;

export type ReviewableSnapshot = {
  buildId: string;
  snapshotId: string;
  targetTitle: string;
  targetName: string;
};

export type SeedReviewableSnapshotOptions = {
  client: SeedClient;
  projectId: string;
  apiKey: string;
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const findBuildIdByCommit = async (
  client: SeedClient,
  projectId: string,
  branch: string,
  commitSha: string,
): Promise<string> => {
  const { builds } = await client.builds.list({
    projectIds: [projectId],
    branches: [branch],
    limit: SNAPSHOT_LIST_LIMIT,
  });

  const build = builds.find((candidate) => candidate.commitSha === commitSha);
  if (!build) {
    throw new Error(`Could not find an ingested build on "${branch}" for commit ${commitSha}`);
  }
  return build.id;
};

// Seeds a snapshot in "needs_review". Storybook renders deterministically, so a
// build never diffs against a re-ingest of itself; overwriting one target's
// baseline image with another's forces that target's next capture to diff.
export const seedReviewableSnapshot = async ({
  client,
  projectId,
  apiKey,
}: SeedReviewableSnapshotOptions): Promise<ReviewableSnapshot> => {
  const baseline = await ingestStorybook({ apiKey, branch: "main" });
  if (baseline.exitCode !== 0) {
    throw new Error(`Baseline ingest failed (exit ${baseline.exitCode}): ${baseline.stderr}`);
  }
  const baselineBuildId = await findBuildIdByCommit(client, projectId, "main", baseline.commitSha);

  const { snapshots } = await client.snapshots.list({
    buildId: baselineBuildId,
    limit: SNAPSHOT_LIST_LIMIT,
  });
  const captured = snapshots.filter((snapshot) => snapshot.imagePath !== null);
  const target = captured[0];
  const donor = captured.find((snapshot) => snapshot.targetId !== target?.targetId) ?? captured[1];

  if (!target?.imagePath || !donor?.imagePath) {
    throw new Error("Expected at least two captured baseline snapshots to seed a reviewable diff");
  }

  const donorImage = await streamToBuffer(await storage.getFileStream(donor.imagePath));
  await storage.uploadFile(target.imagePath, donorImage, "image/png");

  // A needs-review build exits non-zero, which ingestStorybook returns without throwing.
  const candidate = await ingestStorybook({ apiKey, branch: FEATURE_BRANCH });
  const buildId = await findBuildIdByCommit(client, projectId, FEATURE_BRANCH, candidate.commitSha);

  const { snapshots: candidateSnapshots } = await client.snapshots.list({
    buildId,
    statuses: ["needs_review"],
    limit: SNAPSHOT_LIST_LIMIT,
  });

  const reviewable =
    candidateSnapshots.find(
      (snapshot) =>
        snapshot.targetId === target.targetId &&
        snapshot.browser === target.browser &&
        snapshot.viewportWidth === target.viewportWidth &&
        snapshot.viewportHeight === target.viewportHeight,
    ) ?? candidateSnapshots[0];

  if (!reviewable) {
    throw new Error(
      `Feature-branch ingest did not produce a needs_review snapshot (exit ${candidate.exitCode}): ${candidate.stderr}`,
    );
  }

  return {
    buildId,
    snapshotId: reviewable.id,
    targetTitle: reviewable.targetTitle,
    targetName: reviewable.targetName,
  };
};
