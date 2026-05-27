import { asc, eq } from "drizzle-orm";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { db as defaultDb } from "../client";
import { project } from "../schema/projects";

type Db = NodePgDatabase;

type ProjectInsert = typeof project.$inferInsert;
type ProjectSelect = typeof project.$inferSelect;

export const findAll = async (db: Db = defaultDb): Promise<ProjectSelect[]> => {
  return db.select().from(project).orderBy(asc(project.name));
};

export const findBySlug = async (
  slug: string,
  db: Db = defaultDb,
): Promise<ProjectSelect | undefined> => {
  const [row] = await db.select().from(project).where(eq(project.slug, slug));
  return row;
};

export const findById = async (
  id: string,
  db: Db = defaultDb,
): Promise<ProjectSelect | undefined> => {
  const [row] = await db.select().from(project).where(eq(project.id, id));
  return row;
};

export const slugExists = async (slug: string, db: Db = defaultDb): Promise<boolean> => {
  const [row] = await db.select({ id: project.id }).from(project).where(eq(project.slug, slug));
  return row !== undefined;
};

export const create = async (
  data: Omit<ProjectInsert, "id" | "createdAt">,
  db: Db = defaultDb,
): Promise<ProjectSelect> => {
  const [row] = await db.insert(project).values(data).returning();
  return row!;
};

export const update = async (
  id: string,
  patch: Partial<Omit<ProjectInsert, "id" | "createdAt" | "createdBy">>,
  db: Db = defaultDb,
): Promise<ProjectSelect> => {
  const [row] = await db.update(project).set(patch).where(eq(project.id, id)).returning();
  return row!;
};

export const deleteProject = async (id: string, db: Db = defaultDb): Promise<void> => {
  await db.delete(project).where(eq(project.id, id));
};
