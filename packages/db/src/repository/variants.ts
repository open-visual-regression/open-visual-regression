import { count, eq } from "drizzle-orm";

import { db } from "../db";
import { variants } from "../schema";

export const findByProject = (projectId: string) =>
  db.query.variants.findMany({
    where: (variants, { eq }) => eq(variants.projectId, projectId),
  });

export type FindByProjectResult = Awaited<ReturnType<typeof findByProject>>;

export type VariantDbSchema = FindByProjectResult[number];

export const addVariant = async (values: typeof variants.$inferInsert) => {
  const [variant] = await db.insert(variants).values(values).returning();
  return variant;
};

export const deleteVariant = async (id: string) => {
  await db.delete(variants).where(eq(variants.id, id));
};

export const countByProject = async (projectId: string) => {
  const [result] = await db
    .select({ count: count() })
    .from(variants)
    .where(eq(variants.projectId, projectId));

  return result?.count ?? 0;
};
