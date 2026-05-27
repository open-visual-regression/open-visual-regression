import { count, eq } from "drizzle-orm";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { db as defaultDb } from "../client";
import { variant } from "../schema/projects";

type Db = NodePgDatabase;

type VariantInsert = typeof variant.$inferInsert;
type VariantSelect = typeof variant.$inferSelect;

export const findByProject = async (
  projectId: string,
  db: Db = defaultDb,
): Promise<VariantSelect[]> => {
  return db.select().from(variant).where(eq(variant.projectId, projectId));
};

export const create = async (
  data: Omit<VariantInsert, "id">,
  db: Db = defaultDb,
): Promise<VariantSelect> => {
  const [row] = await db.insert(variant).values(data).returning();
  return row!;
};

export const deleteVariant = async (id: string, db: Db = defaultDb): Promise<void> => {
  await db.delete(variant).where(eq(variant.id, id));
};

export const countByProject = async (projectId: string, db: Db = defaultDb): Promise<number> => {
  const [row] = await db
    .select({ count: count() })
    .from(variant)
    .where(eq(variant.projectId, projectId));
  return row?.count ?? 0;
};
