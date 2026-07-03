import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gt,
  ilike,
  inArray,
  lt,
  notExists,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db, type DbClient } from "../db";
import {
  baselines,
  builds,
  diffs,
  projects,
  snapshots,
  type BuildProcessingStatus,
  type BuildReviewStatus,
} from "../schema";

type CreateInput = typeof builds.$inferInsert & { tx?: DbClient };

export const create = async ({ tx = db, ...values }: CreateInput) => {
  const [build] = await tx.insert(builds).values(values).returning();
  return build;
};

export const findById = (id: string) =>
  db.query.builds.findFirst({ where: (builds, { eq }) => eq(builds.id, id) });

export const updateProcessingStatus = async (
  id: string,
  processingStatus: BuildProcessingStatus,
  errorMessage?: string,
  tx: DbClient = db,
) => {
  const [build] = await tx
    .update(builds)
    .set({ processingStatus, errorMessage })
    .where(eq(builds.id, id))
    .returning();
  return build;
};

type UpdateResultInput = {
  processingStatus: BuildProcessingStatus;
  reviewStatus: BuildReviewStatus;
  errorMessage?: string | null;
};

export const updateResult = async (id: string, result: UpdateResultInput) => {
  const [build] = await db.update(builds).set(result).where(eq(builds.id, id)).returning();
  return build;
};

type FindByProjectOptions = {
  branch?: string;
  processingStatus?: BuildProcessingStatus;
  reviewStatus?: BuildReviewStatus;
};

export const findByProject = (projectId: string, opts: FindByProjectOptions = {}) =>
  db.query.builds.findMany({
    where: (builds, { and, eq }) =>
      and(
        eq(builds.projectId, projectId),
        opts.branch ? eq(builds.branch, opts.branch) : undefined,
        opts.processingStatus ? eq(builds.processingStatus, opts.processingStatus) : undefined,
        opts.reviewStatus ? eq(builds.reviewStatus, opts.reviewStatus) : undefined,
      ),
  });

export type BuildDbSchema = Awaited<ReturnType<typeof findById>>;

export type SortDirection = "asc" | "desc";

type BuildsCursor = {
  createdAt: string;
  id: string;
};

export type StatusFilter = {
  processingStatus: BuildProcessingStatus;
  reviewStatus?: BuildReviewStatus;
};

export type ViewportFilter = {
  viewportWidth: number;
  viewportHeight: number;
};

type FindAllInput = {
  organizationId: string;
  projectIds?: string[];
  processingStatus?: BuildProcessingStatus;
  reviewStatus?: BuildReviewStatus;
  statuses?: StatusFilter[];
  browsers?: string[];
  viewports?: ViewportFilter[];
  search?: string;
  sortDirection?: SortDirection;
  limit: number;
  cursor?: BuildsCursor;
};

const getStatusFilter = (statuses?: StatusFilter[]) =>
  statuses?.length
    ? or(
        ...statuses.map((status) =>
          and(
            eq(builds.processingStatus, status.processingStatus),
            status.reviewStatus ? eq(builds.reviewStatus, status.reviewStatus) : undefined,
          ),
        ),
      )
    : undefined;

const getBrowserFilter = (browsers?: string[]) =>
  browsers?.length
    ? exists(
        db
          .select({ one: sql`1` })
          .from(snapshots)
          .where(and(eq(snapshots.buildId, builds.id), inArray(snapshots.browser, browsers))),
      )
    : undefined;

const getViewportFilter = (viewports?: ViewportFilter[]) =>
  viewports?.length
    ? exists(
        db
          .select({ one: sql`1` })
          .from(snapshots)
          .where(
            and(
              eq(snapshots.buildId, builds.id),
              or(
                ...viewports.map((viewport) =>
                  and(
                    eq(snapshots.viewportWidth, viewport.viewportWidth),
                    eq(snapshots.viewportHeight, viewport.viewportHeight),
                  ),
                ),
              ),
            ),
          ),
      )
    : undefined;

const getCursorFilter = (cursor: BuildsCursor, sortDirection: SortDirection) => {
  if (sortDirection === "asc") {
    return sql`(${builds.createdAt}, ${builds.id}) > (${cursor.createdAt}::timestamp, ${cursor.id}::uuid)`;
  }
  return sql`(${builds.createdAt}, ${builds.id}) < (${cursor.createdAt}::timestamp, ${cursor.id}::uuid)`;
};

export const findAll = async ({
  organizationId,
  projectIds,
  processingStatus,
  reviewStatus,
  statuses,
  browsers,
  viewports,
  search,
  sortDirection = "desc",
  limit,
  cursor,
}: FindAllInput) => {
  const baseFilter = and(
    eq(projects.organizationId, organizationId),
    projectIds?.length ? inArray(builds.projectId, projectIds) : undefined,
    processingStatus ? eq(builds.processingStatus, processingStatus) : undefined,
    reviewStatus ? eq(builds.reviewStatus, reviewStatus) : undefined,
    getStatusFilter(statuses),
    getBrowserFilter(browsers),
    getViewportFilter(viewports),
    search ? ilike(builds.name, `%${search}%`) : undefined,
  );

  // Keyset pagination on (createdAt, id): matches the composite index and stays
  // stable when new builds are inserted at the top mid-scroll.
  const cursorFilter = cursor ? getCursorFilter(cursor, sortDirection) : undefined;

  const orderFn = sortDirection === "asc" ? asc : desc;

  const [rows, [totalResult]] = await Promise.all([
    db
      .select({
        id: builds.id,
        projectId: builds.projectId,
        projectName: projects.name,
        branch: builds.branch,
        errorMessage: builds.errorMessage,
        commitSha: builds.commitSha,
        name: builds.name,
        author: builds.author,
        processingStatus: builds.processingStatus,
        reviewStatus: builds.reviewStatus,
        buildType: builds.buildType,
        createdAt: builds.createdAt,
      })
      .from(builds)
      .innerJoin(projects, eq(builds.projectId, projects.id))
      .where(and(baseFilter, cursorFilter))
      .orderBy(orderFn(builds.createdAt), orderFn(builds.id))
      .limit(limit + 1),
    db
      .select({ count: count() })
      .from(builds)
      .innerJoin(projects, eq(builds.projectId, projects.id))
      .where(baseFilter),
  ]);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows.at(-1);
  const nextCursor = hasMore && lastRow ? { createdAt: lastRow.createdAt, id: lastRow.id } : null;

  return { builds: pageRows, total: totalResult?.count ?? 0, nextCursor };
};

export type FindAllResult = Awaited<ReturnType<typeof findAll>>;

export type BuildListItemDbSchema = FindAllResult["builds"][number];

export type ViewportOption = ViewportFilter & {
  viewportName: string;
};

export const findDistinctViewports = async (projectId: string): Promise<ViewportOption[]> => {
  const rows = await db
    .selectDistinctOn([snapshots.viewportWidth, snapshots.viewportHeight], {
      viewportWidth: snapshots.viewportWidth,
      viewportHeight: snapshots.viewportHeight,
      viewportName: snapshots.viewportName,
    })
    .from(snapshots)
    .innerJoin(builds, eq(snapshots.buildId, builds.id))
    .where(eq(builds.projectId, projectId))
    .orderBy(asc(snapshots.viewportWidth), asc(snapshots.viewportHeight));

  return rows;
};

export const findExpiredPage = async (
  projectId: string,
  cutoff: string,
  limit: number,
): Promise<string[]> => {
  const rows = await db
    .select({ id: builds.id })
    .from(builds)
    .where(
      and(
        eq(builds.projectId, projectId),
        lt(builds.createdAt, cutoff),
        notExists(
          db
            .select({ one: sql`1` })
            .from(snapshots)
            .innerJoin(baselines, eq(baselines.snapshotId, snapshots.id))
            .where(eq(snapshots.buildId, builds.id)),
        ),
      ),
    )
    .orderBy(asc(builds.createdAt), asc(builds.id))
    .limit(limit);

  return rows.map((row) => row.id);
};

export const removeMany = async (tx: DbClient, ids: string[]): Promise<void> => {
  if (ids.length === 0) {
    return;
  }

  await tx.delete(builds).where(inArray(builds.id, ids));
};

export const findStale = async (cutoff: string, limit: number): Promise<string[]> => {
  const diffSnapshots = alias(snapshots, "diff_snapshots");

  const rows = await db
    .select({ id: builds.id })
    .from(builds)
    .where(
      and(
        inArray(builds.processingStatus, ["queued", "processing"]),
        lt(builds.createdAt, cutoff),
        notExists(
          db
            .select({ one: sql`1` })
            .from(snapshots)
            .where(and(eq(snapshots.buildId, builds.id), gt(snapshots.updatedAt, cutoff))),
        ),
        notExists(
          db
            .select({ one: sql`1` })
            .from(diffs)
            .innerJoin(diffSnapshots, eq(diffs.snapshotId, diffSnapshots.id))
            .where(and(eq(diffSnapshots.buildId, builds.id), gt(diffs.updatedAt, cutoff))),
        ),
      ),
    )
    .orderBy(asc(builds.createdAt))
    .limit(limit);

  return rows.map((row) => row.id);
};
