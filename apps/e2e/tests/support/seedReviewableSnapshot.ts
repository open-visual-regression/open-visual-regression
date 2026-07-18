import type { Readable } from "node:stream";

import { storage } from "@ovr/storage";

import type { SeedClient } from "../seed/client";
import { ingestStorybook } from "./ingest";

// A branch other than the project's gitMainBranch ("main"), so the build is
// reviewed rather than auto-promoting its captures as the new baseline.
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

// Produces a snapshot that lands in "needs_review" so the review UI can be
// exercised end to end. Storybook renders deterministically, so re-ingesting the
// same build never diffs against itself; instead we overwrite one target's
// stored baseline image with another target's image, so the next capture of that
// target diverges past the diff threshold. This drives the real capture + diff
// pipeline (no hand-inserted rows) and yields the full comparison view.
export const seedReviewableSnapshot = async ({
  client,
  projectId,
  apiKey,
}: SeedReviewableSnapshotOptions): Promise<ReviewableSnapshot> => {
  // 1. Ingest on main to establish a promoted baseline for every target.
  const baseline = await ingestStorybook({ apiKey, branch: "main" });
  if (baseline.exitCode !== 0) {
    throw new Error(`Baseline ingest failed (exit ${baseline.exitCode}): ${baseline.stderr}`);
  }
  const baselineBuildId = await findBuildIdByCommit(client, projectId, "main", baseline.commitSha);

  // 2. Pick two visually distinct baseline captures and overwrite the target's
  //    stored image with the donor's, guaranteeing a large diff on re-capture.
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

  // 3. Re-ingest the same Storybook on a feature branch. The tampered baseline
  //    now differs from the real capture, so the target needs review. The CLI
  //    exits non-zero for a needs-review build, which ingestStorybook surfaces
  //    without throwing.
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
