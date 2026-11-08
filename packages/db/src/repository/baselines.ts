import { and, type AnyColumn, eq, gte, inArray, or } from "drizzle-orm";

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

export const findMany = (projectId: string, keys: BaselineKey[]) =>
  keys.length === 0
    ? Promise.resolve([])
    : db
        .select()
        .from(baselines)
        .where(matchesBaselineKeys(baselines, projectId, keys));

export type BaselineDbSchema = Awaited<ReturnType<typeof findByProject>>[number];
