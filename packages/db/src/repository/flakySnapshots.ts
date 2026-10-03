import { and, count, countDistinct, desc, eq, gt, isNotNull, ne, sql } from "drizzle-orm";

import { db } from "../db";
import { builds, flakySnapshots, projects, snapshots } from "../schema";

export type RecomputeFlakySnapshotsOptions = {
  windowBuilds: number;
  minReverts: number;
  minSamples: number;
  minChangeRate: number;
};

const findStoryStats = (projectId: string, windowBuilds: number) => {
  const recentBuilds = db.$with("recent_builds").as(
    db
      .select({ id: builds.id, createdAt: builds.createdAt, commitSha: builds.commitSha })
      .from(builds)
      .innerJoin(projects, eq(projects.id, builds.projectId))
      .where(and(eq(builds.projectId, projectId), eq(builds.branch, projects.gitMainBranch)))
      .orderBy(desc(builds.createdAt), desc(builds.id))
      .limit(windowBuilds),
  );

  const samples = db.$with("samples").as(
    db
      .select({
        browser: snapshots.browser,
        viewportWidth: snapshots.viewportWidth,
        viewportHeight: snapshots.viewportHeight,
        targetId: snapshots.targetId,
        variantId: snapshots.variantId,
        commitSha: recentBuilds.commitSha,
        previousVariantId: sql<string | null>`lag(${snapshots.variantId}) over (
          partition by ${snapshots.browser}, ${snapshots.viewportWidth}, ${snapshots.viewportHeight}, ${snapshots.targetId}
          order by ${recentBuilds.createdAt}, ${recentBuilds.id}
        )`.as("previous_variant_id"),
      })
      .from(recentBuilds)
      .innerJoin(snapshots, eq(snapshots.buildId, recentBuilds.id))
      .where(isNotNull(snapshots.variantId)),
  );

  const storyKey = [
    samples.browser,
    samples.viewportWidth,
    samples.viewportHeight,
    samples.targetId,
  ] as const;

  const mismatchedCommits = db.$with("mismatched_commits").as(
    db
      .select({
        browser: samples.browser,
        viewportWidth: samples.viewportWidth,
        viewportHeight: samples.viewportHeight,
        targetId: samples.targetId,
      })
      .from(samples)
      .groupBy(...storyKey, samples.commitSha)
      .having(gt(countDistinct(samples.variantId), 1)),
  );

  const sameCommitMismatches = db.$with("same_commit_mismatches").as(
    db
      .select({
        browser: mismatchedCommits.browser,
        viewportWidth: mismatchedCommits.viewportWidth,
        viewportHeight: mismatchedCommits.viewportHeight,
        targetId: mismatchedCommits.targetId,
        mismatchCount: count().as("mismatch_count"),
      })
      .from(mismatchedCommits)
      .groupBy(
        mismatchedCommits.browser,
        mismatchedCommits.viewportWidth,
        mismatchedCommits.viewportHeight,
        mismatchedCommits.targetId,
      ),
  );

  return db
    .with(recentBuilds, samples, mismatchedCommits, sameCommitMismatches)
    .select({
      browser: samples.browser,
      viewportWidth: samples.viewportWidth,
      viewportHeight: samples.viewportHeight,
      targetId: samples.targetId,
      sampleCount: count(),
      changeCount: count(
        sql`case when ${ne(samples.variantId, samples.previousVariantId)} then 1 end`,
      ),
      variantCount: countDistinct(samples.variantId),
      sameCommitMismatchCount:
        sql<number>`coalesce(max(${sameCommitMismatches.mismatchCount}), 0)`.mapWith(Number),
    })
    .from(samples)
    .leftJoin(
      sameCommitMismatches,
      and(
        eq(sameCommitMismatches.browser, samples.browser),
        eq(sameCommitMismatches.viewportWidth, samples.viewportWidth),
        eq(sameCommitMismatches.viewportHeight, samples.viewportHeight),
        eq(sameCommitMismatches.targetId, samples.targetId),
      ),
    )
    .groupBy(...storyKey);
};

export const recomputeForProject = async (
  projectId: string,
  { windowBuilds, minReverts, minSamples, minChangeRate }: RecomputeFlakySnapshotsOptions,
): Promise<void> => {
  const stats = await findStoryStats(projectId, windowBuilds);

  const flaky = stats
    .map(({ variantCount, ...story }) => ({
      ...story,
      revertCount: story.changeCount + 1 - variantCount,
    }))
    .filter(
      ({ sampleCount, changeCount, revertCount, sameCommitMismatchCount }) =>
        revertCount >= minReverts ||
        sameCommitMismatchCount > 0 ||
        (sampleCount >= minSamples && changeCount / (sampleCount - 1) >= minChangeRate),
    );

  await db.transaction(async (tx) => {
    await tx.delete(flakySnapshots).where(eq(flakySnapshots.projectId, projectId));

    if (flaky.length > 0) {
      await tx.insert(flakySnapshots).values(flaky.map((story) => ({ projectId, ...story })));
    }

    await tx
      .update(projects)
      .set({ flakyScannedAt: sql`now()` })
      .where(eq(projects.id, projectId));
  });
};

type FlakySnapshotKey = {
  projectId: string;
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  targetId: string;
};

export const find = ({
  projectId,
  browser,
  viewportWidth,
  viewportHeight,
  targetId,
}: FlakySnapshotKey) =>
  db.query.flakySnapshots.findFirst({
    where: (flakySnapshots, { and, eq }) =>
      and(
        eq(flakySnapshots.projectId, projectId),
        eq(flakySnapshots.browser, browser),
        eq(flakySnapshots.viewportWidth, viewportWidth),
        eq(flakySnapshots.viewportHeight, viewportHeight),
        eq(flakySnapshots.targetId, targetId),
      ),
  });

export const findByProject = (projectId: string) =>
  db.query.flakySnapshots.findMany({
    where: (flakySnapshots, { eq }) => eq(flakySnapshots.projectId, projectId),
  });

export type FlakySnapshotDbSchema = Awaited<ReturnType<typeof findByProject>>[number];
