import { eq, inArray } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { diffs, snapshots, type DiffProcessingStatus, type DiffReviewStatus } from "../schema";

export const create = async (values: typeof diffs.$inferInsert) => {
  const [diff] = await db.insert(diffs).values(values).returning();
  return diff;
};

type CreateManyInput = { values: (typeof diffs.$inferInsert)[]; tx?: DbClient };

export const createMany = async ({ values, tx = db }: CreateManyInput) => {
  if (values.length === 0) {
    return [];
  }

  return tx.insert(diffs).values(values).returning();
};

export const findById = (id: string) =>
  db.query.diffs.findFirst({ where: (diffs, { eq }) => eq(diffs.id, id) });

export const findBySnapshot = (snapshotId: string) =>
  db.query.diffs.findFirst({ where: (diffs, { eq }) => eq(diffs.snapshotId, snapshotId) });

export const findByBuild = async (buildId: string) => {
  const rows = await db
    .select({ diff: diffs })
    .from(diffs)
    .innerJoin(snapshots, eq(diffs.snapshotId, snapshots.id))
    .where(eq(snapshots.buildId, buildId));

  return rows.map((row) => row.diff);
};

export const updateProcessingStatus = async (
  id: string,
  processingStatus: DiffProcessingStatus,
) => {
  const [diff] = await db
    .update(diffs)
    .set({ processingStatus })
    .where(eq(diffs.id, id))
    .returning();
  return diff;
};

type UpdateResultInput = {
  processingStatus: DiffProcessingStatus;
  reviewStatus: DiffReviewStatus;
  diffImagePath?: string;
  pixelDiffCount?: number;
  diffPercent?: number;
};

export const updateResult = async (id: string, result: UpdateResultInput) => {
  const [diff] = await db.update(diffs).set(result).where(eq(diffs.id, id)).returning();
  return diff;
};

export const updateReviewStatus = async (id: string, reviewStatus: DiffReviewStatus) => {
  const [diff] = await db.update(diffs).set({ reviewStatus }).where(eq(diffs.id, id)).returning();
  return diff;
};

export const updateReviewStatusMany = async (ids: string[], reviewStatus: DiffReviewStatus) => {
  if (ids.length === 0) {
    return [];
  }

  return db.update(diffs).set({ reviewStatus }).where(inArray(diffs.id, ids)).returning();
};

export const hasAllDoneForBuild = async (buildId: string) => {
  const rows = await db
    .select({ processingStatus: diffs.processingStatus })
    .from(diffs)
    .innerJoin(snapshots, eq(diffs.snapshotId, snapshots.id))
    .where(eq(snapshots.buildId, buildId));

  return rows.length > 0 && rows.every((row) => row.processingStatus !== "pending");
};

export type DiffDbSchema = Awaited<ReturnType<typeof findById>>;
