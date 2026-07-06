import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNotNull,
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

// Cancels the build only while it is still queued or processing; returns
// undefined when it has already finished, so callers can no-op safely.
export const cancelIfInProgress = async (id: string, canceledBy: string, tx: DbClient = db) => {
  const [build] = await tx
    .update(builds)
    .set({ processingStatus: "canceled", errorMessage: null, canceledBy })
    .where(and(eq(builds.id, id), inArray(builds.processingStatus, ["queued", "processing"])))
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

type FindAllInput = {
  organizationId: string;
  projectIds?: string[];
  processingStatus?: BuildProcessingStatus;
  reviewStatus?: BuildReviewStatus;
  statuses?: StatusFilter[];
  branches?: string[];
  authors?: string[];
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
  branches,
  authors,
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
    branches?.length ? inArray(builds.branch, branches) : undefined,
    authors?.length ? inArray(builds.author, authors) : undefined,
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

export type BuildDisplayStatus =
  | "queued"
  | "processing"
  | "needs_review"
  | "passed"
  | "approved"
  | "rejected"
  | "error"
  | "canceled";

const buildDisplayStatusExpr = sql<BuildDisplayStatus>`case
  when ${builds.processingStatus} = 'error' then 'error'
  when ${builds.processingStatus} = 'canceled' then 'canceled'
  when ${builds.processingStatus} = 'queued' then 'queued'
  when ${builds.processingStatus} = 'processing' then 'processing'
  when ${builds.reviewStatus} = 'rejected' then 'rejected'
  when ${builds.reviewStatus} = 'needs_review' then 'needs_review'
  when ${builds.reviewStatus} = 'approved' then 'approved'
  else 'passed'
end`;

const buildStatusDisplayOrder: BuildDisplayStatus[] = [
  "queued",
  "processing",
  "needs_review",
  "passed",
  "approved",
  "rejected",
  "error",
  "canceled",
];

export const findStatuses = async (projectId: string): Promise<BuildDisplayStatus[]> => {
  const rows = await db
    .selectDistinct({ status: buildDisplayStatusExpr })
    .from(builds)
    .where(eq(builds.projectId, projectId));

  const present = new Set(rows.map((row) => row.status));
  return buildStatusDisplayOrder.filter((status) => present.has(status));
};

type SearchOptions = {
  search?: string;
  limit: number;
};

export const findBranches = async (
  projectId: string,
  { search, limit }: SearchOptions,
): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ branch: builds.branch })
    .from(builds)
    .where(
      and(
        eq(builds.projectId, projectId),
        search ? ilike(builds.branch, `%${search}%`) : undefined,
      ),
    )
    .orderBy(asc(builds.branch))
    .limit(limit);

  return rows.map((row) => row.branch);
};

export const findAuthors = async (
  projectId: string,
  { search, limit }: SearchOptions,
): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ author: builds.author })
    .from(builds)
    .where(
      and(
        eq(builds.projectId, projectId),
        isNotNull(builds.author),
        search ? ilike(builds.author, `%${search}%`) : undefined,
      ),
    )
    .orderBy(asc(builds.author))
    .limit(limit);

  return rows.map((row) => row.author!);
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
