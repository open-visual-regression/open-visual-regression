import { and, type AnyColumn, asc, eq, gt, gte, inArray, or, sql } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { baselineRevisions, baselines, builds, snapshots } from "../schema";

type FindInput = {
  projectId: string;
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  targetId: string;
};

export const find = ({ projectId, browser, viewportWidth, viewportHeight, targetId }: FindInput) =>
  db.query.baselines.findFirst({
    where: (baselines, { and, eq }) =>
      and(
        eq(baselines.projectId, projectId),
        eq(baselines.browser, browser),
        eq(baselines.viewportWidth, viewportWidth),
        eq(baselines.viewportHeight, viewportHeight),
        eq(baselines.targetId, targetId),
      ),
  });

const selectBuildCreatedAt = (snapshotId: string | AnyColumn) =>
  db
    .select({ createdAt: builds.createdAt })
    .from(snapshots)
    .innerJoin(builds, eq(builds.id, snapshots.buildId))
    .where(eq(snapshots.id, snapshotId));

const getNotOlderBuildFilter = (snapshotId: string) =>
  gte(selectBuildCreatedAt(snapshotId), selectBuildCreatedAt(baselines.snapshotId));

// Resolves to undefined when a newer build already set this baseline.
export const upsert = async (values: typeof baselines.$inferInsert, tx: DbClient = db) => {
  const [baseline] = await tx
    .insert(baselines)
    .values(values)
    .onConflictDoUpdate({
      target: [
        baselines.projectId,
        baselines.browser,
        baselines.viewportWidth,
        baselines.viewportHeight,
        baselines.targetId,
      ],
      set: {
        snapshotId: values.snapshotId,
        approvedAt: values.approvedAt,
        approvedBy: values.approvedBy,
      },
      setWhere: getNotOlderBuildFilter(values.snapshotId),
    })
    .returning();
  return baseline;
};

export const findByProject = (projectId: string) =>
  db.query.baselines.findMany({
    where: (baselines, { eq }) => eq(baselines.projectId, projectId),
  });

export type BaselineKey = {
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  targetId: string;
};

// Groups the keys by viewport, so each group matches the key indexes on its full prefix.
export const matchesBaselineKeys = (
  table: typeof baselines | typeof baselineRevisions,
  projectId: string,
  keys: BaselineKey[],
) => {
  const byViewport = new Map<string, { viewport: BaselineKey; targetIds: string[] }>();
  for (const key of keys) {
    const viewport = [key.browser, key.viewportWidth, key.viewportHeight].join(":");
    const group = byViewport.get(viewport) ?? { viewport: key, targetIds: [] };
    group.targetIds.push(key.targetId);
    byViewport.set(viewport, group);
  }

  return and(
    eq(table.projectId, projectId),
    or(
      ...[...byViewport.values()].map(({ viewport, targetIds }) =>
        and(
          eq(table.browser, viewport.browser),
          eq(table.viewportWidth, viewport.viewportWidth),
          eq(table.viewportHeight, viewport.viewportHeight),
          inArray(table.targetId, targetIds),
        ),
      ),
    ),
  );
};

export const findByKeysWithRevisionAfter = async (
  projectId: string,
  keys: BaselineKey[],
  after: string | null,
) => {
  if (keys.length === 0) {
    return [];
  }

  if (!after) {
    const rows = await db
      .select()
      .from(baselines)
      .where(matchesBaselineKeys(baselines, projectId, keys));
    return rows.map((baseline) => ({ baseline, revision: null }));
  }

  const firstRevision = db
    .select({
      id: baselineRevisions.id,
      replacedExisting: baselineRevisions.replacedExisting,
      previousSnapshotId: baselineRevisions.previousSnapshotId,
    })
    .from(baselineRevisions)
    .where(
      and(
        eq(baselineRevisions.projectId, baselines.projectId),
        eq(baselineRevisions.browser, baselines.browser),
        eq(baselineRevisions.viewportWidth, baselines.viewportWidth),
        eq(baselineRevisions.viewportHeight, baselines.viewportHeight),
        eq(baselineRevisions.targetId, baselines.targetId),
        gt(baselineRevisions.createdAt, after),
      ),
    )
    .orderBy(asc(baselineRevisions.createdAt), asc(baselineRevisions.id))
    .limit(1)
    .as("first_revision");

  return db
    .select({
      baseline: baselines,
      revision: {
        id: firstRevision.id,
        replacedExisting: firstRevision.replacedExisting,
        previousSnapshotId: firstRevision.previousSnapshotId,
      },
    })
    .from(baselines)
    .leftJoinLateral(firstRevision, sql`true`)
    .where(matchesBaselineKeys(baselines, projectId, keys));
};

export type BaselineDbSchema = Awaited<ReturnType<typeof findByProject>>[number];
