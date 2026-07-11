import { and, count, desc, eq, sql } from "drizzle-orm";

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

type ProjectsCursor = {
  createdAt: string;
  id: string;
};

const getCursorFilter = (cursor: ProjectsCursor) =>
  sql`(${projects.createdAt}, ${projects.id}) < (${cursor.createdAt}::timestamp, ${cursor.id}::uuid)`;

type FindAllInput = ProjectsFilter & {
  limit: number;
  cursor?: ProjectsCursor;
};

export const findAll = async ({ organizationId, limit, cursor }: FindAllInput) => {
  const baseFilter = buildProjectsFilter({ organizationId });
  const cursorFilter = cursor ? getCursorFilter(cursor) : undefined;

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
    orderBy: [desc(projects.createdAt), desc(projects.id)],
    limit: limit + 1,
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows.at(-1);
  const nextCursor = hasMore && lastRow ? { createdAt: lastRow.createdAt, id: lastRow.id } : null;

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

export const deleteProject = async (id: string) => {
  await db.delete(projects).where(eq(projects.id, id));
};

export type ListProjectsResultDbSchema = Awaited<ReturnType<typeof listProjects>>;

export type ProjectDbSchema = ListProjectsResultDbSchema[number];

export type ProjectCreatorDbSchema = ProjectDbSchema["creator"];
