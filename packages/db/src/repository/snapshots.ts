import { and, asc, count, desc, eq, ilike, inArray, ne, notInArray, or, sql } from "drizzle-orm";

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
  // Won't resurrect a snapshot canceled mid-capture; returns undefined in that
  // case so the caller skips enqueuing a diff.
  const [snapshot] = await tx
    .update(snapshots)
    .set(result)
    .where(and(eq(snapshots.id, id), ne(snapshots.status, "canceled")))
    .returning();
  return snapshot;
};

// Transitions snapshots still queued or in flight to a terminal status (error
// when reaped, canceled when a build is canceled), leaving finished ones as-is.
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
  when coalesce(${diffs.pixelDiffCount}, 0) > 0 then 'auto_approved'
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
  const orderBy = sql.join(
    defaultSnapshotSortBy.map(
      ({ column, direction }) => sql`${snapshotSortColumns[column]} ${sql.raw(direction)}`,
    ),
    sql`, `,
  );

  const { rows } = await db.execute<{
    prev_id: string | null;
    next_id: string | null;
    position: number;
    total: number;
  }>(sql`
    with ordered as (
      select
        ${snapshots.id} as id,
        row_number() over (order by ${orderBy}) as position,
        count(*) over () as total,
        lag(${snapshots.id}) over (order by ${orderBy}) as prev_id,
        lead(${snapshots.id}) over (order by ${orderBy}) as next_id
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
  sortBy?: SnapshotSort[];
  limit: number;
  offset: number;
};

export const listForBuild = (
  buildId: string,
  {
    statuses,
    browsers,
    viewports,
    search,
    sortBy = defaultSnapshotSortBy,
    limit,
    offset,
  }: ListForBuildOptions,
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
      viewportName: snapshots.viewportName,
      imagePath: snapshots.imagePath,
      status: displayStatusExpr,
      diffId: diffs.id,
      diffImagePath: diffs.diffImagePath,
      diffPercent: diffs.diffPercent,
    })
    .from(snapshots)
    .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
    .where(listForBuildWhere(buildId, { statuses, browsers, viewports, search }))
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
