import { and, asc, count, desc, eq, sql } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { projects } from "../schema";

export const findById = (id: string) =>
  db.query.projects.findFirst({ where: (projects, { eq }) => eq(projects.id, id) });

type GetProjectInput = {
  projectId: string;
  organizationId: string;
};

export const getProject = async ({ projectId, organizationId }: GetProjectInput) =>
  db.query.projects.findFirst({
    columns: {
      id: true,
      name: true,
      description: true,
      gitMainBranch: true,
      retentionDays: true,
      requiredReviewerCount: true,
      totalBuildsCount: true,
      createdAt: true,
    },
    with: { creator: { columns: { id: true, name: true, email: true } } },
    where: (projects, { eq, and }) =>
      and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)),
  });

type ProjectsFilter = {
  organizationId: string;
};

const buildProjectsFilter = ({ organizationId }: ProjectsFilter) =>
  eq(projects.organizationId, organizationId);

type ListProjectsInput = ProjectsFilter & {
  limit?: number;
  offset?: number;
};

export const listProjects = ({ organizationId, limit, offset }: ListProjectsInput) =>
  db.query.projects.findMany({
    columns: {
      id: true,
      name: true,
      description: true,
      gitMainBranch: true,
      retentionDays: true,
      requiredReviewerCount: true,
      totalBuildsCount: true,
      createdAt: true,
    },
    with: { creator: { columns: { id: true, name: true, email: true } } },
    where: buildProjectsFilter({ organizationId }),
    orderBy: desc(projects.createdAt),
    limit,
    offset,
  });

export type ListProjectsResult = Awaited<ReturnType<typeof listProjects>>;

export type ProjectsSortBy = "name" | "totalBuildsCount" | "createdAt";
export type ProjectsSortDirection = "asc" | "desc";

type SortableRow = Pick<typeof projects.$inferSelect, "name" | "totalBuildsCount" | "createdAt">;

const SORT_CONFIG = {
  name: {
    expression: sql`lower(${projects.name})`,
    cast: sql.raw("text"),
    toCursorValue: (row: SortableRow) => row.name.toLowerCase(),
  },
  totalBuildsCount: {
    expression: sql`${projects.totalBuildsCount}`,
    cast: sql.raw("integer"),
    toCursorValue: (row: SortableRow) => row.totalBuildsCount,
  },
  createdAt: {
    expression: sql`${projects.createdAt}`,
    cast: sql.raw("timestamp"),
    toCursorValue: (row: SortableRow) => row.createdAt,
  },
} satisfies Record<ProjectsSortBy, unknown>;

type ProjectsCursor = {
  sortBy: ProjectsSortBy;
  value: string | number;
  id: string;
};

type FindAllInput = ProjectsFilter & {
  limit: number;
  cursor?: ProjectsCursor;
  sortBy?: ProjectsSortBy;
  sortDirection?: ProjectsSortDirection;
};

export class ProjectsCursorMismatchError extends Error {
  constructor() {
    super("Cursor was created with a different sort");
  }
}

export const findAll = async ({
  organizationId,
  limit,
  cursor,
  sortBy = "totalBuildsCount",
  sortDirection = "desc",
}: FindAllInput) => {
  if (cursor && cursor.sortBy !== sortBy) {
    throw new ProjectsCursorMismatchError();
  }

  const config = SORT_CONFIG[sortBy];
  const order = sortDirection === "asc" ? asc : desc;
  const operator = sql.raw(sortDirection === "asc" ? ">" : "<");

  const baseFilter = buildProjectsFilter({ organizationId });
  const cursorFilter = cursor
    ? sql`(${config.expression}, ${projects.id}) ${operator} (${cursor.value}::${config.cast}, ${cursor.id}::uuid)`
    : undefined;

  const rows = await db.query.projects.findMany({
    columns: {
      id: true,
      name: true,
      description: true,
      gitMainBranch: true,
      retentionDays: true,
      requiredReviewerCount: true,
      totalBuildsCount: true,
      createdAt: true,
    },
    with: { creator: { columns: { id: true, name: true, email: true } } },
    where: and(baseFilter, cursorFilter),
    orderBy: [order(config.expression), order(projects.id)],
    limit: limit + 1,
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows.at(-1);
  const nextCursor: ProjectsCursor | null =
    hasMore && lastRow ? { sortBy, value: config.toCursorValue(lastRow), id: lastRow.id } : null;

  return { projects: pageRows, nextCursor };
};

export type FindAllResult = Awaited<ReturnType<typeof findAll>>;

export const countProjects = async ({ organizationId }: ProjectsFilter) => {
  const [result] = await db
    .select({ count: count() })
    .from(projects)
    .where(buildProjectsFilter({ organizationId }));

  return result?.count ?? 0;
};

export const addProject = async (values: typeof projects.$inferInsert) => {
  const [project] = await db.insert(projects).values(values).returning();
  return project;
};

export const updateProject = async (id: string, patch: Partial<typeof projects.$inferInsert>) => {
  const [project] = await db.update(projects).set(patch).where(eq(projects.id, id)).returning();
  return project;
};

export const incrementTotalBuildsCount = async (projectId: string, tx: DbClient = db) => {
  await tx
    .update(projects)
    .set({ totalBuildsCount: sql`${projects.totalBuildsCount} + 1` })
    .where(eq(projects.id, projectId));
};

export const deleteProject = async (id: string, organizationId: string, tx: DbClient = db) => {
  const [deleted] = await tx
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.organizationId, organizationId)))
    .returning();
  return deleted;
};

export type ListProjectsResultDbSchema = Awaited<ReturnType<typeof listProjects>>;

export type ProjectDbSchema = ListProjectsResultDbSchema[number];

export type ProjectCreatorDbSchema = ProjectDbSchema["creator"];
