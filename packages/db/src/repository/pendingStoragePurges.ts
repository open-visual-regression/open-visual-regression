import { eq, inArray } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { pendingStoragePurges } from "../schema";

export type PendingStoragePurge = typeof pendingStoragePurges.$inferSelect;

type InsertInput = {
  projectId: string;
  buildId: string;
  prefix: string;
};

export const insertMany = async (tx: DbClient, rows: InsertInput[]): Promise<void> => {
  if (rows.length === 0) {
    return;
  }

  await tx.insert(pendingStoragePurges).values(rows);
};

export const findByProject = (projectId: string): Promise<PendingStoragePurge[]> =>
  db.query.pendingStoragePurges.findMany({
    where: (pendingStoragePurges, { eq }) => eq(pendingStoragePurges.projectId, projectId),
  });

export const removeMany = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) {
    return;
  }

  await db.delete(pendingStoragePurges).where(inArray(pendingStoragePurges.id, ids));
};

export const remove = async (id: string): Promise<void> => {
  await db.delete(pendingStoragePurges).where(eq(pendingStoragePurges.id, id));
};
