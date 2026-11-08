import {
  and,
  asc,
  count as countRows,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  ne,
  notInArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { alias, union, unionAll } from "drizzle-orm/pg-core";

import { db, type DbClient } from "../db";
import {
  baselines,
  builds,
  diffs,
  flakySnapshots,
  projects,
  snapshots,
  type SnapshotStatus,
} from "../schema";

export type SnapshotDisplayStatusCounts = {
  unchanged: number;
  auto_approved: number;
  approved: number;
  needs_review: number;
  rejected: number;
  error: number;
  canceled: number;
  skipped: number;
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
  db.query.snapshots.findMany({
    where: (snapshots, { eq }) => eq(snapshots.buildId, buildId),
    orderBy: (snapshots, { asc }) => [
      asc(snapshots.targetId),
      asc(snapshots.browser),
      asc(snapshots.viewportWidth),
      asc(snapshots.viewportHeight),
      asc(snapshots.id),
    ],
  });

export const findById = (id: string) =>
  db.query.snapshots.findFirst({ where: (snapshots, { eq }) => eq(snapshots.id, id) });

export const updateStatus = async (id: string, status: SnapshotStatus) => {
  const [snapshot] = await db
    .update(snapshots)
    .set(
      status === "processing" ? { status, startedAt: sql`now()`, completedAt: null } : { status },
    )
    .where(and(eq(snapshots.id, id), ne(snapshots.status, "canceled")))
    .returning();
  return snapshot;
};

type UpdateCaptureResultInput = {
  status: SnapshotStatus;
  imagePath: string;
  imageHash: string;
  hasRenderError: boolean;
  hasUncaughtPageError: boolean;
  errorMessage: string | null;
  tx?: DbClient;
};

export const updateCaptureResult = async (
  id: string,
  { tx = db, ...result }: UpdateCaptureResultInput,
) => {
  const [snapshot] = await tx
    .update(snapshots)
    .set({ ...result, completedAt: sql`now()` })
    .where(and(eq(snapshots.id, id), ne(snapshots.status, "canceled")))
    .returning();
  return snapshot;
};

export const setVariant = async (id: string, variantId: string, tx: DbClient = db) => {
  const [snapshot] = await tx
    .update(snapshots)
    .set({ variantId })
    .where(eq(snapshots.id, id))
    .returning();
  return snapshot;
};

export const setBaseline = async (id: string, baselineSnapshotId: string | null) => {
  await db.update(snapshots).set({ baselineSnapshotId }).where(eq(snapshots.id, id));
};

const FIRST_UUID = "00000000-0000-0000-0000-000000000000";

// Copies the baselines of the next `limit` diffs after `afterDiffId`, in primary-key order,
// onto snapshots that have none yet. Returns the last diff it looked at, or null when there
// are no diffs left.
export const copyBaselinesFromDiffs = async (
  afterDiffId: string | null,
  limit: number,
  tx: DbClient = db,
): Promise<{ lastDiffId: string | null; copied: number }> => {
  const { rows } = await tx.execute<{ last_diff_id: string | null; copied: number }>(sql`
    with batch as (
      select ${diffs.id} as id, ${diffs.snapshotId} as snapshot_id,
        ${diffs.baselineSnapshotId} as baseline_snapshot_id
      from ${diffs}
      where ${diffs.id} > ${afterDiffId ?? FIRST_UUID}::uuid
      order by ${diffs.id}
      limit ${limit}
    ),
    copied as (
      update ${snapshots}
      set baseline_snapshot_id = batch.baseline_snapshot_id
      from batch
      where ${snapshots.id} = batch.snapshot_id
        and batch.baseline_snapshot_id is not null
        and ${snapshots.baselineSnapshotId} is null
      returning 1
    )
    select (select id from batch order by id desc limit 1) as last_diff_id,
      (select count(*) from copied)::int as copied
  `);

  return { lastDiffId: rows[0]?.last_diff_id ?? null, copied: rows[0]?.copied ?? 0 };
};

export const markErrored = async (id: string, errorMessage: string) => {
  const [snapshot] = await db
    .update(snapshots)
    .set({ status: "error", errorMessage, completedAt: sql`now()` })
    .where(and(eq(snapshots.id, id), ne(snapshots.status, "canceled")))
    .returning();
  return snapshot;
};

export const requeue = async (id: string, tx: DbClient = db) => {
  const [snapshot] = await tx
    .update(snapshots)
    .set({
      status: "queued",
      captureAttempt: sql`${snapshots.captureAttempt} + 1`,
      imagePath: null,
      imageHash: null,
      baselineSnapshotId: null,
      hasRenderError: false,
      hasUncaughtPageError: false,
      errorMessage: null,
      queuedAt: sql`now()`,
      startedAt: null,
      completedAt: null,
    })
    .where(eq(snapshots.id, id))
    .returning();
  return snapshot;
};

export const markUnfinishedAs = async (
  buildId: string,
  status: SnapshotStatus,
  tx: DbClient = db,
): Promise<string[]> => {
  const rows = await tx
    .update(snapshots)
    .set({ status, completedAt: sql`now()` })
    .where(
      and(
        eq(snapshots.buildId, buildId),
        notInArray(snapshots.status, ["success", "error", "canceled", "skipped"]),
      ),
    )
    .returning({ id: snapshots.id });
  return rows.map((row) => row.id);
};

export const countByBuild = async (buildId: string) => {
  const [result] = await db
    .select({ count: countRows() })
    .from(snapshots)
    .where(eq(snapshots.buildId, buildId));
  return result?.count ?? 0;
};

export const countToCapture = async (buildId: string) => {
  const [result] = await db
    .select({ count: countRows() })
    .from(snapshots)
    .where(and(eq(snapshots.buildId, buildId), ne(snapshots.status, "skipped")));
  return result?.count ?? 0;
};

const displayStatusExpr = sql<SnapshotDisplayStatus>`case
  when ${snapshots.status} = 'skipped' then 'skipped'
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
    .select({ status: displayStatusExpr, count: countRows() })
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
    skipped: 0,
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
  "auto_approved",
  "unchanged",
  "approved",
  "needs_review",
  "rejected",
  "error",
  "canceled",
  "skipped",
  "queued",
  "processing",
];

const isFlaky = exists(
  db
    .select({ id: flakySnapshots.id })
    .from(flakySnapshots)
    .innerJoin(builds, eq(builds.projectId, flakySnapshots.projectId))
    .where(
      and(
        eq(builds.id, snapshots.buildId),
        eq(flakySnapshots.browser, snapshots.browser),
        eq(flakySnapshots.viewportWidth, snapshots.viewportWidth),
        eq(flakySnapshots.viewportHeight, snapshots.viewportHeight),
        eq(flakySnapshots.targetId, snapshots.targetId),
      ),
    ),
).mapWith(Boolean);

const baselineSnapshots = alias(snapshots, "baseline_snapshots");

// A lookup by primary key per listed row rather than a join, so it runs only for the page.
const baselineImagePath = sql<string | null>`(${db
  .select({ imagePath: baselineSnapshots.imagePath })
  .from(baselineSnapshots)
  .where(eq(baselineSnapshots.id, snapshots.baselineSnapshotId))})`;

export type SnapshotFlag = "flaky" | "warning";

const flagConditions: Record<SnapshotFlag, SQL> = {
  flaky: isFlaky,
  warning: eq(snapshots.hasUncaughtPageError, true),
};

const flagDisplayOrder: SnapshotFlag[] = ["flaky", "warning"];

export type ListFilters = {
  organizationId?: string;
  buildId?: string;
  latestMainBuild?: boolean;
  projectIds?: string[];
  baseline?: boolean;
  statuses?: SnapshotDisplayStatus[];
  browsers?: string[];
  viewports?: string[];
  flags?: SnapshotFlag[];
  search?: string;
};

const isBaseline = exists(
  db.select({ id: baselines.id }).from(baselines).where(eq(baselines.snapshotId, snapshots.id)),
);

const scopedProjects = alias(projects, "scoped_projects");
const latestMainBuilds = alias(builds, "latest_main_builds");

type BuildScope = Pick<ListFilters, "organizationId" | "projectIds">;

// Resolve the few latest main build IDs first, so snapshots are found by build_id.
const latestMainBuildIds = ({ organizationId, projectIds }: BuildScope) => {
  const latestMainBuild = db
    .select({ id: latestMainBuilds.id })
    .from(latestMainBuilds)
    .where(
      and(
        eq(latestMainBuilds.projectId, scopedProjects.id),
        eq(latestMainBuilds.branch, scopedProjects.gitMainBranch),
        ne(latestMainBuilds.processingStatus, "canceled"),
      ),
    )
    .orderBy(desc(latestMainBuilds.createdAt), desc(latestMainBuilds.id))
    .limit(1)
    .as("latest_main_build");

  return db
    .select({ id: latestMainBuild.id })
    .from(scopedProjects)
    .crossJoinLateral(latestMainBuild)
    .where(
      and(
        organizationId ? eq(scopedProjects.organizationId, organizationId) : undefined,
        projectIds?.length ? inArray(scopedProjects.id, projectIds) : undefined,
      ),
    );
};

const isOnLatestMainBuild = (scope: BuildScope) =>
  inArray(snapshots.buildId, latestMainBuildIds(scope));

const inFlightStatuses: SnapshotDisplayStatus[] = ["queued", "processing"];

const isInFlight = inArray(displayStatusExpr, inFlightStatuses);

const isInFlightOnly = (statuses?: SnapshotDisplayStatus[]) =>
  !!statuses?.length && statuses.every((status) => inFlightStatuses.includes(status));

const inProgressBuilds = alias(builds, "in_progress_builds");
const inProgressBuildSnapshots = alias(snapshots, "in_progress_build_snapshots");
const unfinishedSnapshots = alias(snapshots, "unfinished_snapshots");
const pendingDiffs = alias(diffs, "pending_diffs");

// Snapshots that can display as queued or processing, each found through a partial index.
// A snapshot with no diff counts only while its build is running.
const isInFlightCandidate = inArray(
  snapshots.id,
  unionAll(
    db
      .select({ id: inProgressBuildSnapshots.id })
      .from(inProgressBuilds)
      .innerJoin(
        inProgressBuildSnapshots,
        eq(inProgressBuildSnapshots.buildId, inProgressBuilds.id),
      )
      .where(inArray(inProgressBuilds.processingStatus, ["queued", "processing"])),
    db
      .select({ id: unfinishedSnapshots.id })
      .from(unfinishedSnapshots)
      .where(inArray(unfinishedSnapshots.status, ["queued", "processing"])),
    db
      .select({ id: pendingDiffs.snapshotId })
      .from(pendingDiffs)
      .where(eq(pendingDiffs.processingStatus, "pending")),
  ),
);

type LatestMainBuildFilters = Pick<ListFilters, "organizationId" | "projectIds" | "statuses">;

const latestMainBuildWhere = ({ statuses, ...scope }: LatestMainBuildFilters) =>
  isInFlightOnly(statuses) ? isInFlightCandidate : isOnLatestMainBuild(scope);

const listWhere = ({
  organizationId,
  buildId,
  latestMainBuild,
  projectIds,
  baseline,
  statuses,
  browsers,
  viewports,
  flags,
  search,
}: ListFilters) =>
  and(
    organizationId ? eq(projects.organizationId, organizationId) : undefined,
    buildId ? eq(snapshots.buildId, buildId) : undefined,
    latestMainBuild ? latestMainBuildWhere({ organizationId, projectIds, statuses }) : undefined,
    projectIds?.length ? inArray(builds.projectId, projectIds) : undefined,
    baseline ? isBaseline : undefined,
    statuses?.length ? inArray(displayStatusExpr, statuses) : undefined,
    browsers?.length ? inArray(snapshots.browser, browsers) : undefined,
    viewports?.length ? inArray(snapshots.viewportName, viewports) : undefined,
    flags?.length ? or(...flags.map((flag) => flagConditions[flag])) : undefined,
    search
      ? or(ilike(snapshots.targetTitle, `%${search}%`), ilike(snapshots.targetName, `%${search}%`))
      : undefined,
  );

export type SnapshotScope = Pick<ListFilters, "organizationId" | "buildId" | "latestMainBuild">;

export const findStatuses = async (scope: SnapshotScope): Promise<SnapshotDisplayStatus[]> => {
  const { latestMainBuild, ...rest } = scope;
  const findDistinct = (where: SQL | undefined) =>
    db
      .selectDistinct({ status: displayStatusExpr })
      .from(snapshots)
      .innerJoin(builds, eq(builds.id, snapshots.buildId))
      .innerJoin(projects, eq(projects.id, builds.projectId))
      .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
      .where(where);

  // A union rather than an OR, since an OR over the computed status can't use an index.
  const rows = await (latestMainBuild
    ? union(
        findDistinct(listWhere({ ...rest, latestMainBuild })),
        findDistinct(and(listWhere(rest), isInFlightCandidate, isInFlight)),
      )
    : findDistinct(listWhere(rest)));

  const present = new Set(rows.map((row) => row.status));
  return statusDisplayOrder.filter((status) => present.has(status));
};

export const findBrowsers = async (scope: SnapshotScope): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ browser: snapshots.browser })
    .from(snapshots)
    .innerJoin(builds, eq(builds.id, snapshots.buildId))
    .innerJoin(projects, eq(projects.id, builds.projectId))
    .where(listWhere(scope))
    .orderBy(asc(snapshots.browser));

  return rows.map((row) => row.browser);
};

export const findViewports = async (scope: SnapshotScope): Promise<string[]> => {
  const rows = await db
    .selectDistinct({
      viewportName: snapshots.viewportName,
      viewportWidth: snapshots.viewportWidth,
    })
    .from(snapshots)
    .innerJoin(builds, eq(builds.id, snapshots.buildId))
    .innerJoin(projects, eq(projects.id, builds.projectId))
    .where(listWhere(scope))
    .orderBy(asc(snapshots.viewportWidth), asc(snapshots.viewportName));

  return [...new Set(rows.map((row) => row.viewportName))];
};

export const findFlags = async (scope: SnapshotScope): Promise<SnapshotFlag[]> => {
  const flaky = db
    .select({ id: snapshots.id })
    .from(flakySnapshots)
    .innerJoin(projects, eq(projects.id, flakySnapshots.projectId))
    .innerJoin(builds, eq(builds.projectId, flakySnapshots.projectId))
    .innerJoin(
      snapshots,
      and(
        eq(snapshots.buildId, builds.id),
        eq(snapshots.browser, flakySnapshots.browser),
        eq(snapshots.viewportWidth, flakySnapshots.viewportWidth),
        eq(snapshots.viewportHeight, flakySnapshots.viewportHeight),
        eq(snapshots.targetId, flakySnapshots.targetId),
      ),
    )
    .where(listWhere(scope))
    .limit(1);

  const warning = db
    .select({ id: snapshots.id })
    .from(snapshots)
    .innerJoin(builds, eq(builds.id, snapshots.buildId))
    .innerJoin(projects, eq(projects.id, builds.projectId))
    .where(and(listWhere(scope), eq(snapshots.hasUncaughtPageError, true)))
    .limit(1);

  const [flakyRows, warningRows] = await Promise.all([flaky, warning]);
  const present: Record<SnapshotFlag, boolean> = {
    flaky: flakyRows.length > 0,
    warning: warningRows.length > 0,
  };

  return flagDisplayOrder.filter((flag) => present[flag]);
};

// needs_review/rejected/approved share a tier so that reviewing a snapshot
// (which changes its reviewStatus) can't move it past its neighbors and
// reorder the grid or shift prev/next navigation underneath the reviewer.
const statusPriorityExpr = sql<number>`case (${displayStatusExpr})
  when 'error' then 1
  when 'needs_review' then 2
  when 'rejected' then 2
  when 'approved' then 2
  when 'auto_approved' then 3
  when 'unchanged' then 4
  when 'skipped' then 5
  when 'processing' then 6
  when 'queued' then 7
  when 'canceled' then 8
end`;

const snapshotOrderBy = sql`
  ${statusPriorityExpr} asc,
  ${snapshots.targetTitle} asc,
  ${snapshots.targetName} asc,
  ${snapshots.browser} asc,
  ${snapshots.viewportWidth} asc,
  ${snapshots.id} asc
`;

export type SnapshotSort = "status" | "name";

export type SnapshotsCursor = {
  statusPriority?: number;
  targetTitle: string;
  targetName: string;
  browser: string;
  viewportWidth: number;
  id: string;
};

const nameOrderBy = [
  asc(snapshots.targetTitle),
  asc(snapshots.targetName),
  asc(snapshots.browser),
  asc(snapshots.viewportWidth),
  asc(snapshots.id),
];

const getCursorFilter = (cursor: SnapshotsCursor, sort: SnapshotSort) =>
  sort === "status"
    ? sql`(${statusPriorityExpr}, ${snapshots.targetTitle}, ${snapshots.targetName}, ${snapshots.browser}, ${snapshots.viewportWidth}, ${snapshots.id})
      > (${cursor.statusPriority ?? 0}::int, ${cursor.targetTitle}::text, ${cursor.targetName}::text, ${cursor.browser}::text, ${cursor.viewportWidth}::int, ${cursor.id}::uuid)`
    : sql`(${snapshots.targetTitle}, ${snapshots.targetName}, ${snapshots.browser}, ${snapshots.viewportWidth}, ${snapshots.id})
      > (${cursor.targetTitle}::text, ${cursor.targetName}::text, ${cursor.browser}::text, ${cursor.viewportWidth}::int, ${cursor.id}::uuid)`;

export type AdjacentSnapshotIds = {
  prevId: string | null;
  nextId: string | null;
  position: number | null;
  total: number | null;
};

const sortKeyExprs = {
  status_priority: statusPriorityExpr,
  target_title: snapshots.targetTitle,
  target_name: snapshots.targetName,
  browser: snapshots.browser,
  viewport_width: snapshots.viewportWidth,
  id: snapshots.id,
};

const sortKeyColumns = Object.keys(sortKeyExprs);

const sortKeyProjection = sql.join(
  Object.entries(sortKeyExprs).map(([column, expr]) => sql`${expr} as ${sql.raw(column)}`),
  sql`, `,
);

const sortKey = (alias: string) =>
  sql.raw(`(${sortKeyColumns.map((column) => `${alias}.${column}`).join(", ")})`);

const sortKeyOrder = (alias: string, direction: "asc" | "desc") =>
  sql.raw(sortKeyColumns.map((column) => `${alias}.${column} ${direction}`).join(", "));

// Neighbors come from sort position rather than set membership, and the viewed
// snapshot is counted at its own position even once a review drops it out of
// the filters, so reviewing never blanks prev/next or shrinks the count.
export const findAdjacentIds = async (
  buildId: string,
  snapshotId: string,
  filters: Omit<
    ListFilters,
    "organizationId" | "buildId" | "latestMainBuild" | "projectIds" | "baseline"
  > = {},
): Promise<AdjacentSnapshotIds> => {
  const { rows } = await db.execute<{
    prev_id: string | null;
    next_id: string | null;
    preceding: number;
    filtered_total: number;
    in_filtered_set: boolean;
  }>(sql`
    with current as (
      select ${sortKeyProjection}
      from ${snapshots}
      left join ${diffs} on ${diffs.snapshotId} = ${snapshots.id}
      where ${snapshots.id} = ${snapshotId} and ${snapshots.buildId} = ${buildId}
    ),
    filtered as (
      select ${sortKeyProjection}
      from ${snapshots}
      left join ${diffs} on ${diffs.snapshotId} = ${snapshots.id}
      where ${listWhere({ ...filters, buildId })}
    )
    select
      (
        select f.id from filtered f
        where ${sortKey("f")} < ${sortKey("c")}
        order by ${sortKeyOrder("f", "desc")}
        limit 1
      ) as prev_id,
      (
        select f.id from filtered f
        where ${sortKey("f")} > ${sortKey("c")}
        order by ${sortKeyOrder("f", "asc")}
        limit 1
      ) as next_id,
      (
        select count(*) from filtered f where ${sortKey("f")} <= ${sortKey("c")}
      ) as preceding,
      (select count(*) from filtered) as filtered_total,
      exists (select 1 from filtered f where f.id = c.id) as in_filtered_set
    from current c
  `);

  const row = rows[0];
  if (!row) {
    return { prevId: null, nextId: null, position: null, total: null };
  }

  const offset = row.in_filtered_set ? 0 : 1;
  return {
    prevId: row.prev_id,
    nextId: row.next_id,
    position: Number(row.preceding) + offset,
    total: Number(row.filtered_total) + offset,
  };
};

export type ListOptions = {
  sort?: SnapshotSort;
  limit: number;
  cursor?: SnapshotsCursor;
};

export const list = async ({
  sort = "status",
  limit,
  cursor,
  ...filters
}: ListFilters & ListOptions) => {
  const rows = await db
    .select({
      id: snapshots.id,
      buildId: snapshots.buildId,
      projectId: projects.id,
      projectName: projects.name,
      targetId: snapshots.targetId,
      targetTitle: snapshots.targetTitle,
      targetName: snapshots.targetName,
      browser: snapshots.browser,
      viewportWidth: snapshots.viewportWidth,
      viewportHeight: snapshots.viewportHeight,
      viewportName: snapshots.viewportName,
      imagePath: snapshots.imagePath,
      baselineImagePath,
      hasUncaughtPageError: snapshots.hasUncaughtPageError,
      queuedAt: snapshots.queuedAt,
      startedAt: snapshots.startedAt,
      completedAt: snapshots.completedAt,
      status: displayStatusExpr,
      statusPriority: statusPriorityExpr,
      diffId: diffs.id,
      diffImagePath: diffs.diffImagePath,
      diffPercent: diffs.diffPercent,
      isFlaky,
    })
    .from(snapshots)
    .innerJoin(builds, eq(builds.id, snapshots.buildId))
    .innerJoin(projects, eq(projects.id, builds.projectId))
    .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
    .where(and(listWhere(filters), cursor ? getCursorFilter(cursor, sort) : undefined))
    .orderBy(...(sort === "status" ? [snapshotOrderBy] : nameOrderBy))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows.at(-1);

  return {
    snapshots: pageRows,
    nextCursor:
      hasMore && lastRow
        ? {
            ...(sort === "status" && { statusPriority: lastRow.statusPriority }),
            targetTitle: lastRow.targetTitle,
            targetName: lastRow.targetName,
            browser: lastRow.browser,
            viewportWidth: lastRow.viewportWidth,
            id: lastRow.id,
          }
        : null,
  };
};

export const count = async (filters: ListFilters = {}) => {
  const [result] = await db
    .select({ count: countRows() })
    .from(snapshots)
    .innerJoin(builds, eq(builds.id, snapshots.buildId))
    .innerJoin(projects, eq(projects.id, builds.projectId))
    .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
    .where(listWhere(filters));
  return result?.count ?? 0;
};

export type SnapshotHistoryCursor = {
  createdAt: string;
  buildId: string;
  direction: "next" | "previous";
};

export type FindHistoryOptions = {
  projectId: string;
  branch: string;
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  targetId: string;
  limit: number;
  cursor: SnapshotHistoryCursor & { inclusive?: boolean };
};

type HistoryBuildKey = Pick<SnapshotHistoryCursor, "createdAt" | "buildId">;

const historyBuildComparison = (
  operator: "<" | "<=" | ">",
  { createdAt, buildId }: HistoryBuildKey,
) =>
  sql`(${builds.createdAt}, ${builds.id}) ${sql.raw(operator)} (${createdAt}::timestamp, ${buildId}::uuid)`;

const getHistoryCursorOperator = ({
  direction,
  inclusive,
}: NonNullable<FindHistoryOptions["cursor"]>): "<" | "<=" | ">" => {
  if (direction === "previous") {
    return ">";
  }

  return inclusive ? "<=" : "<";
};

export const findHistory = async ({
  projectId,
  branch,
  browser,
  viewportWidth,
  viewportHeight,
  targetId,
  limit,
  cursor,
}: FindHistoryOptions) => {
  const matchesStory = and(
    eq(builds.projectId, projectId),
    eq(builds.branch, branch),
    eq(snapshots.browser, browser),
    eq(snapshots.viewportWidth, viewportWidth),
    eq(snapshots.viewportHeight, viewportHeight),
    eq(snapshots.targetId, targetId),
  );

  const hasNewerStory = async (key: HistoryBuildKey) => {
    const [row] = await db
      .select({ id: snapshots.id })
      .from(builds)
      .innerJoin(snapshots, eq(snapshots.buildId, builds.id))
      .where(and(matchesStory, historyBuildComparison(">", key)))
      .limit(1);
    return row !== undefined;
  };

  const rows = await db
    .select({
      id: snapshots.id,
      buildId: builds.id,
      buildName: builds.name,
      commitSha: builds.commitSha,
      createdAt: builds.createdAt,
      status: displayStatusExpr,
      diffPercent: diffs.diffPercent,
      variantId: snapshots.variantId,
      imagePath: snapshots.imagePath,
      hasUncaughtPageError: snapshots.hasUncaughtPageError,
    })
    .from(builds)
    .innerJoin(snapshots, eq(snapshots.buildId, builds.id))
    .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
    .where(and(matchesStory, historyBuildComparison(getHistoryCursorOperator(cursor), cursor)))
    .orderBy(
      ...(cursor.direction === "previous"
        ? [asc(builds.createdAt), asc(builds.id)]
        : [desc(builds.createdAt), desc(builds.id)]),
    )
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  if (cursor.direction === "previous") {
    pageRows.reverse();
  }

  const newest = pageRows.at(0);
  const oldest = pageRows.at(-1);

  const toCursor = (key: HistoryBuildKey, direction: SnapshotHistoryCursor["direction"]) => ({
    createdAt: key.createdAt,
    buildId: key.buildId,
    direction,
  });

  if (cursor.direction === "previous") {
    return {
      snapshots: pageRows,
      nextCursor: toCursor(oldest ?? cursor, "next"),
      previousCursor: hasMore ? toCursor(newest ?? cursor, "previous") : null,
    };
  }

  const hasNewer = cursor.inclusive ? await hasNewerStory(newest ?? cursor) : true;

  return {
    snapshots: pageRows,
    nextCursor: hasMore && oldest ? toCursor(oldest, "next") : null,
    previousCursor: hasNewer ? toCursor(newest ?? cursor, "previous") : null,
  };
};

export type FindHistoryAroundOptions = Omit<FindHistoryOptions, "cursor"> & {
  anchor: HistoryBuildKey;
};

export const findHistoryAround = async ({
  anchor,
  limit,
  ...options
}: FindHistoryAroundOptions) => {
  const newerLimit = Math.floor(limit / 2);

  const [newer, older] = await Promise.all([
    findHistory({ ...options, limit: newerLimit, cursor: { ...anchor, direction: "previous" } }),
    findHistory({
      ...options,
      limit: limit - newerLimit,
      cursor: { ...anchor, direction: "next", inclusive: true },
    }),
  ]);

  return {
    snapshots: [...newer.snapshots, ...older.snapshots],
    nextCursor: older.nextCursor,
    previousCursor: newer.previousCursor,
  };
};

export type SnapshotDbSchema = Awaited<ReturnType<typeof findByBuild>>[number];
