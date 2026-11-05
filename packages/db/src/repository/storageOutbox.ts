import { count, eq, min } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { storageOutbox } from "../schema";

export type StorageOutboxEntry = typeof storageOutbox.$inferSelect;

type InsertInput = {
  projectId: string;
  buildId: string;
  prefix: string;
};

export const insertMany = async (tx: DbClient, rows: InsertInput[]): Promise<void> => {
  if (rows.length === 0) {
    return;
  }

  await tx.insert(storageOutbox).values(rows);
};

export const findByProject = (projectId: string): Promise<StorageOutboxEntry[]> =>
  db.query.storageOutbox.findMany({
    where: (storageOutbox, { eq }) => eq(storageOutbox.projectId, projectId),
  });

export const remove = async (id: string): Promise<void> => {
  await db.delete(storageOutbox).where(eq(storageOutbox.id, id));
};

export const removeByProject = async (tx: DbClient, projectId: string): Promise<void> => {
  await tx.delete(storageOutbox).where(eq(storageOutbox.projectId, projectId));
};

export type StorageOutboxSummary = { pending: number; oldestCreatedAt: string | null };

export const summarize = async (): Promise<StorageOutboxSummary> => {
  const [row] = await db
    .select({ pending: count(), oldestCreatedAt: min(storageOutbox.createdAt) })
    .from(storageOutbox);

  return { pending: row?.pending ?? 0, oldestCreatedAt: row?.oldestCreatedAt ?? null };
};
