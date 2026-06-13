import { eq } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { builds, type BuildStatus } from "../schema";

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
