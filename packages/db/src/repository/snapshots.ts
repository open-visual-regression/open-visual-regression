import { and, count, eq, ilike, or, sql } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { diffs, snapshots, type SnapshotStatus } from "../schema";

export type SnapshotDisplayStatusCounts = {
  pass: number;
  approved: number;
  changed: number;
  rejected: number;
  fail: number;
  pending: number;
};

type CreateManyInput = { values: (typeof snapshots.$inferInsert)[]; tx?: DbClient };

export const createMany = async ({ values, tx = db }: CreateManyInput) => {
  if (values.length === 0) {
    return [];
  }

  return tx.insert(snapshots).values(values).returning();
};

export const findByBuild = (buildId: string) =>
  db.query.snapshots.findMany({ where: (snapshots, { eq }) => eq(snapshots.buildId, buildId) });

export const findById = (id: string) =>
  db.query.snapshots.findFirst({ where: (snapshots, { eq }) => eq(snapshots.id, id) });

export const updateStatus = async (id: string, status: SnapshotStatus) => {
  const [snapshot] = await db
    .update(snapshots)
    .set({ status })
    .where(eq(snapshots.id, id))
    .returning();
  return snapshot;
};

type UpdateCaptureResultInput = {
  status: SnapshotStatus;
  imagePath: string;
  hasRenderError: boolean;
  tx?: DbClient;
};

export const updateCaptureResult = async (
  id: string,
  { tx = db, ...result }: UpdateCaptureResultInput,
) => {
  const [snapshot] = await tx.update(snapshots).set(result).where(eq(snapshots.id, id)).returning();
  return snapshot;
};

export const hasAllCapturedForBuild = async (buildId: string) => {
  const rows = await db.query.snapshots.findMany({
    columns: { status: true },
    where: (snapshots, { eq }) => eq(snapshots.buildId, buildId),
  });
  return rows.length > 0 && rows.every((row) => row.status !== "pending");
};

export const countByBuild = async (buildId: string) => {
  const [result] = await db
    .select({ count: count() })
    .from(snapshots)
    .where(eq(snapshots.buildId, buildId));
  return result?.count ?? 0;
};

const displayStatusExpr = sql<string>`case
  when ${snapshots.status} = 'error' or ${snapshots.hasRenderError} then 'fail'
  when ${snapshots.status} = 'pending' or ${diffs.id} is null or ${diffs.processingStatus} = 'pending' then 'pending'
  when ${diffs.processingStatus} = 'error' then 'fail'
  when ${diffs.reviewStatus} = 'rejected' then 'rejected'
  when ${diffs.reviewStatus} = 'needs_review' then 'changed'
  when ${diffs.reviewStatus} = 'approved' then 'approved'
  else 'pass'
end`;

export const getDisplayStatusCounts = async (
  buildId: string,
): Promise<SnapshotDisplayStatusCounts> => {
  const rows = await db
    .select({ status: displayStatusExpr, count: count() })
    .from(snapshots)
    .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
    .where(eq(snapshots.buildId, buildId))
    .groupBy(displayStatusExpr);

  const counts: SnapshotDisplayStatusCounts = {
    pass: 0,
    approved: 0,
    changed: 0,
    rejected: 0,
    fail: 0,
    pending: 0,
  };

  for (const row of rows) {
    counts[row.status as keyof SnapshotDisplayStatusCounts] = row.count;
  }

  return counts;
};

export type SnapshotDisplayStatus = keyof SnapshotDisplayStatusCounts;

type ListForBuildFilters = { status?: SnapshotDisplayStatus; search?: string };

const listForBuildWhere = (buildId: string, { status, search }: ListForBuildFilters) =>
  and(
    eq(snapshots.buildId, buildId),
    status ? sql`${displayStatusExpr} = ${status}` : undefined,
    search
      ? or(ilike(snapshots.targetTitle, `%${search}%`), ilike(snapshots.targetName, `%${search}%`))
      : undefined,
  );

export type ListForBuildOptions = ListForBuildFilters & { limit: number; offset: number };

export const listForBuild = (
  buildId: string,
  { status, search, limit, offset }: ListForBuildOptions,
) =>
  db
    .select({
      id: snapshots.id,
      targetId: snapshots.targetId,
      targetTitle: snapshots.targetTitle,
      targetName: snapshots.targetName,
      browser: snapshots.browser,
      viewportWidth: snapshots.viewportWidth,
      viewportHeight: snapshots.viewportHeight,
      imagePath: snapshots.imagePath,
      status: displayStatusExpr,
      diffId: diffs.id,
      diffImagePath: diffs.diffImagePath,
      diffPercent: diffs.diffPercent,
    })
    .from(snapshots)
    .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
    .where(listForBuildWhere(buildId, { status, search }))
    .orderBy(
      snapshots.targetTitle,
      snapshots.targetName,
      snapshots.browser,
      snapshots.viewportWidth,
    )
    .limit(limit)
    .offset(offset);

export const countForBuild = async (buildId: string, filters: ListForBuildFilters = {}) => {
  const [result] = await db
    .select({ count: count() })
    .from(snapshots)
    .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
    .where(listForBuildWhere(buildId, filters));
  return result?.count ?? 0;
};

export type SnapshotDbSchema = Awaited<ReturnType<typeof findByBuild>>[number];
