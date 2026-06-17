import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { builds, projects, type BuildStatus } from "../schema";

type CreateInput = typeof builds.$inferInsert & { tx?: DbClient };

export const create = async ({ tx = db, ...values }: CreateInput) => {
  const [build] = await tx.insert(builds).values(values).returning();
  return build;
};

export const findById = (id: string) =>
  db.query.builds.findFirst({ where: (builds, { eq }) => eq(builds.id, id) });

export const updateStatus = async (id: string, status: BuildStatus) => {
  const [build] = await db.update(builds).set({ status }).where(eq(builds.id, id)).returning();
  return build;
};

type FindByProjectOptions = {
  branch?: string;
  status?: BuildStatus;
};

export const findByProject = (projectId: string, opts: FindByProjectOptions = {}) =>
  db.query.builds.findMany({
    where: (builds, { and, eq }) =>
      and(
        eq(builds.projectId, projectId),
        opts.branch ? eq(builds.branch, opts.branch) : undefined,
        opts.status ? eq(builds.status, opts.status) : undefined,
      ),
  });

export type BuildDbSchema = Awaited<ReturnType<typeof findById>>;

export type SortDirection = "asc" | "desc";

type FindAllInput = {
  organizationId: string;
  projectIds?: string[];
  status?: BuildStatus;
  sortDirection?: SortDirection;
  limit: number;
  offset: number;
};

export const findAll = async ({
  organizationId,
  projectIds,
  status,
  sortDirection = "desc",
  limit,
  offset,
}: FindAllInput) => {
  const filter = and(
    eq(projects.organizationId, organizationId),
    projectIds?.length ? inArray(builds.projectId, projectIds) : undefined,
    status ? eq(builds.status, status) : undefined,
  );

  const orderFn = sortDirection === "asc" ? asc : desc;

  const [rows, [totalResult]] = await Promise.all([
    db
      .select({
        id: builds.id,
        projectId: builds.projectId,
        projectName: projects.name,
        branch: builds.branch,
        commitSha: builds.commitSha,
        name: builds.name,
        author: builds.author,
        status: builds.status,
        createdAt: builds.createdAt,
      })
      .from(builds)
      .innerJoin(projects, eq(builds.projectId, projects.id))
      .where(filter)
      .orderBy(orderFn(builds.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(builds)
      .innerJoin(projects, eq(builds.projectId, projects.id))
      .where(filter),
  ]);

  return { builds: rows, total: totalResult?.count ?? 0 };
};

export type FindAllResult = Awaited<ReturnType<typeof findAll>>;

export type BuildListItemDbSchema = FindAllResult["builds"][number];
