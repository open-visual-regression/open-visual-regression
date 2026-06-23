import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { diffs, snapshots, type SnapshotStatus } from "../schema";

export type SnapshotDisplayStatusCounts = {
  passed: number;
  approved: number;
  needs_review: number;
  rejected: number;
  error: number;
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
  when ${snapshots.status} = 'error' or ${snapshots.hasRenderError} then 'error'
  when ${snapshots.status} = 'pending' or ${diffs.id} is null or ${diffs.processingStatus} = 'pending' then 'pending'
  when ${diffs.processingStatus} = 'error' then 'error'
  when ${diffs.reviewStatus} = 'rejected' then 'rejected'
  when ${diffs.reviewStatus} = 'needs_review' then 'needs_review'
  when ${diffs.reviewStatus} = 'approved' then 'approved'
  else 'passed'
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
    passed: 0,
    approved: 0,
    needs_review: 0,
    rejected: 0,
    error: 0,
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

const statusPriorityExpr = sql<number>`case (${displayStatusExpr})
  when 'error' then 1
  when 'needs_review' then 2
  when 'rejected' then 3
  when 'approved' then 4
  when 'passed' then 5
  when 'pending' then 6
end`;

export const snapshotSortColumns = {
  status: statusPriorityExpr,
  targetTitle: snapshots.targetTitle,
  targetName: snapshots.targetName,
  browser: snapshots.browser,
  viewportWidth: snapshots.viewportWidth,
} as const;

export type SnapshotSortColumn = keyof typeof snapshotSortColumns;

export type SnapshotSortDirection = "asc" | "desc";

export type SnapshotSort = { column: SnapshotSortColumn; direction: SnapshotSortDirection };

export const defaultSnapshotSortBy: SnapshotSort[] = [
  { column: "status", direction: "asc" },
  { column: "targetTitle", direction: "asc" },
  { column: "targetName", direction: "asc" },
  { column: "browser", direction: "asc" },
  { column: "viewportWidth", direction: "asc" },
];

export type ListForBuildOptions = ListForBuildFilters & {
  sortBy?: SnapshotSort[];
  limit: number;
  offset: number;
};

export const listForBuild = (
  buildId: string,
  { status, search, sortBy = defaultSnapshotSortBy, limit, offset }: ListForBuildOptions,
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
      ...sortBy.map(({ column, direction }) =>
        (direction === "desc" ? desc : asc)(snapshotSortColumns[column]),
      ),
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
