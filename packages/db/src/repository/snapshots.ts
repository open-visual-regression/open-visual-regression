import { and, asc, count, eq, ilike, inArray, ne, notInArray, or, sql } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { diffs, snapshots, type SnapshotStatus } from "../schema";

export type SnapshotDisplayStatusCounts = {
  unchanged: number;
  auto_approved: number;
  approved: number;
  needs_review: number;
  rejected: number;
  error: number;
  canceled: number;
  queued: number;
  processing: number;
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
    .where(and(eq(snapshots.id, id), ne(snapshots.status, "canceled")))
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
  const [snapshot] = await tx
    .update(snapshots)
    .set(result)
    .where(and(eq(snapshots.id, id), ne(snapshots.status, "canceled")))
    .returning();
  return snapshot;
};

export const markUnfinishedAs = async (
  buildId: string,
  status: SnapshotStatus,
  tx: DbClient = db,
): Promise<void> => {
  await tx
    .update(snapshots)
    .set({ status })
    .where(
      and(
        eq(snapshots.buildId, buildId),
        notInArray(snapshots.status, ["success", "error", "canceled"]),
      ),
    );
};

export const countByBuild = async (buildId: string) => {
  const [result] = await db
    .select({ count: count() })
    .from(snapshots)
    .where(eq(snapshots.buildId, buildId));
  return result?.count ?? 0;
};

const displayStatusExpr = sql<SnapshotDisplayStatus>`case
  when ${snapshots.status} = 'error' or ${snapshots.hasRenderError} then 'error'
  when ${snapshots.status} = 'canceled' then 'canceled'
  when ${snapshots.status} = 'queued' then 'queued'
  when ${snapshots.status} = 'processing' then 'processing'
  when ${diffs.processingStatus} = 'canceled' then 'canceled'
  when ${diffs.id} is null or ${diffs.processingStatus} = 'pending' then 'queued'
  when ${diffs.processingStatus} = 'error' then 'error'
  when ${diffs.reviewStatus} = 'rejected' then 'rejected'
  when ${diffs.reviewStatus} = 'needs_review' then 'needs_review'
  when ${diffs.reviewStatus} = 'approved' then 'approved'
  when ${diffs.reviewStatus} = 'auto_approved' then 'auto_approved'
  else 'unchanged'
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
    unchanged: 0,
    auto_approved: 0,
    approved: 0,
    needs_review: 0,
    rejected: 0,
    error: 0,
    canceled: 0,
    queued: 0,
    processing: 0,
  };

  for (const row of rows) {
    counts[row.status] = row.count;
  }

  return counts;
};

export type SnapshotDisplayStatus = keyof SnapshotDisplayStatusCounts;

const statusDisplayOrder: SnapshotDisplayStatus[] = [
  "unchanged",
  "auto_approved",
  "approved",
  "needs_review",
  "rejected",
  "error",
  "canceled",
  "queued",
  "processing",
];

type ListForBuildFilters = {
  statuses?: SnapshotDisplayStatus[];
  browsers?: string[];
  viewports?: string[];
  search?: string;
};

const listForBuildWhere = (
  buildId: string,
  { statuses, browsers, viewports, search }: ListForBuildFilters,
) =>
  and(
    eq(snapshots.buildId, buildId),
    statuses?.length
      ? or(...statuses.map((status) => sql`${displayStatusExpr} = ${status}`))
      : undefined,
    browsers?.length ? inArray(snapshots.browser, browsers) : undefined,
    viewports?.length ? inArray(snapshots.viewportName, viewports) : undefined,
    search
      ? or(ilike(snapshots.targetTitle, `%${search}%`), ilike(snapshots.targetName, `%${search}%`))
      : undefined,
  );

export const findStatuses = async (buildId: string): Promise<SnapshotDisplayStatus[]> => {
  const rows = await db
    .selectDistinct({ status: displayStatusExpr })
    .from(snapshots)
    .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
    .where(eq(snapshots.buildId, buildId));

  const present = new Set(rows.map((row) => row.status));
  return statusDisplayOrder.filter((status) => present.has(status));
};

export const findBrowsers = async (buildId: string): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ browser: snapshots.browser })
    .from(snapshots)
    .where(eq(snapshots.buildId, buildId))
    .orderBy(asc(snapshots.browser));

  return rows.map((row) => row.browser);
};

export const findViewports = async (buildId: string): Promise<string[]> => {
  const rows = await db
    .selectDistinct({
      viewportName: snapshots.viewportName,
      viewportWidth: snapshots.viewportWidth,
    })
    .from(snapshots)
    .where(eq(snapshots.buildId, buildId))
    .orderBy(asc(snapshots.viewportWidth), asc(snapshots.viewportName));

  return rows.map((row) => row.viewportName);
};

// needs_review/rejected/approved share a tier so that reviewing a snapshot
// (which changes its reviewStatus) can't move it past its neighbors and
// reorder the grid or shift prev/next navigation underneath the reviewer.
const statusPriorityExpr = sql<number>`case (${displayStatusExpr})
  when 'error' then 1
  when 'needs_review' then 2
  when 'rejected' then 2
  when 'approved' then 2
  when 'unchanged' then 3
  when 'auto_approved' then 3
  when 'processing' then 4
  when 'queued' then 5
  when 'canceled' then 6
end`;

const snapshotOrderBy = sql`
  ${statusPriorityExpr} asc,
  ${snapshots.targetTitle} asc,
  ${snapshots.targetName} asc,
  ${snapshots.browser} asc,
  ${snapshots.viewportWidth} asc,
  ${snapshots.id} asc
`;

export type SnapshotsCursor = {
  statusPriority: number;
  targetTitle: string;
  targetName: string;
  browser: string;
  viewportWidth: number;
  id: string;
};

const getCursorFilter = (cursor: SnapshotsCursor) =>
  sql`(${statusPriorityExpr}, ${snapshots.targetTitle}, ${snapshots.targetName}, ${snapshots.browser}, ${snapshots.viewportWidth}, ${snapshots.id})
      > (${cursor.statusPriority}::int, ${cursor.targetTitle}::text, ${cursor.targetName}::text, ${cursor.browser}::text, ${cursor.viewportWidth}::int, ${cursor.id}::uuid)`;

export type AdjacentSnapshotIds = {
  prevId: string | null;
  nextId: string | null;
  position: number | null;
  total: number | null;
};

export const findAdjacentReviewableIds = async (
  buildId: string,
  snapshotId: string,
): Promise<AdjacentSnapshotIds> => {
  const { rows } = await db.execute<{
    prev_id: string | null;
    next_id: string | null;
    position: number;
    total: number;
  }>(sql`
    with ordered as (
      select
        ${snapshots.id} as id,
        row_number() over (order by ${snapshotOrderBy}) as position,
        count(*) over () as total,
        lag(${snapshots.id}) over (order by ${snapshotOrderBy}) as prev_id,
        lead(${snapshots.id}) over (order by ${snapshotOrderBy}) as next_id
      from ${snapshots}
      left join ${diffs} on ${diffs.snapshotId} = ${snapshots.id}
      where ${snapshots.buildId} = ${buildId}
        and ${displayStatusExpr} in ('needs_review', 'rejected', 'approved')
    )
    select position, total, prev_id, next_id from ordered where id = ${snapshotId}
  `);

  const row = rows[0];
  return {
    prevId: row?.prev_id ?? null,
    nextId: row?.next_id ?? null,
    position: row ? Number(row.position) : null,
    total: row ? Number(row.total) : null,
  };
};

export type ListForBuildOptions = ListForBuildFilters & {
  limit: number;
  cursor?: SnapshotsCursor;
};

export const listForBuild = async (
  buildId: string,
  { statuses, browsers, viewports, search, limit, cursor }: ListForBuildOptions,
) => {
  const rows = await db
    .select({
      id: snapshots.id,
      targetId: snapshots.targetId,
      targetTitle: snapshots.targetTitle,
      targetName: snapshots.targetName,
      browser: snapshots.browser,
      viewportWidth: snapshots.viewportWidth,
      viewportHeight: snapshots.viewportHeight,
      viewportName: snapshots.viewportName,
      imagePath: snapshots.imagePath,
      status: displayStatusExpr,
      statusPriority: statusPriorityExpr,
      diffId: diffs.id,
      diffImagePath: diffs.diffImagePath,
      diffPercent: diffs.diffPercent,
    })
    .from(snapshots)
    .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
    .where(
      and(
        listForBuildWhere(buildId, { statuses, browsers, viewports, search }),
        cursor ? getCursorFilter(cursor) : undefined,
      ),
    )
    .orderBy(snapshotOrderBy)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows.at(-1);

  return {
    snapshots: pageRows,
    nextCursor:
      hasMore && lastRow
        ? {
            statusPriority: lastRow.statusPriority,
            targetTitle: lastRow.targetTitle,
            targetName: lastRow.targetName,
            browser: lastRow.browser,
            viewportWidth: lastRow.viewportWidth,
            id: lastRow.id,
          }
        : null,
  };
};

export const countForBuild = async (buildId: string, filters: ListForBuildFilters = {}) => {
  const [result] = await db
    .select({ count: count() })
    .from(snapshots)
    .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
    .where(listForBuildWhere(buildId, filters));
  return result?.count ?? 0;
};

export type SnapshotDbSchema = Awaited<ReturnType<typeof findByBuild>>[number];
