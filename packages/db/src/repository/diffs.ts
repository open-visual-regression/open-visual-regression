import { eq } from "drizzle-orm";

import { db } from "../db";
import { diffs, snapshots, type DiffStatus } from "../schema";

export const create = async (values: typeof diffs.$inferInsert) => {
  const [diff] = await db.insert(diffs).values(values).returning();
  return diff;
};

export const findById = (id: string) =>
  db.query.diffs.findFirst({ where: (diffs, { eq }) => eq(diffs.id, id) });

export const findByBuild = async (buildId: string) => {
  const rows = await db
    .select({ diff: diffs })
    .from(diffs)
    .innerJoin(snapshots, eq(diffs.snapshotId, snapshots.id))
    .where(eq(snapshots.buildId, buildId));

  return rows.map((row) => row.diff);
};

export const updateStatus = async (id: string, status: DiffStatus) => {
  const [diff] = await db.update(diffs).set({ status }).where(eq(diffs.id, id)).returning();
  return diff;
};

type UpdateReviewInput = {
  reviewerId: string;
  reviewedAt: string;
  status: DiffStatus;
};

export const updateReview = async (id: string, review: UpdateReviewInput) => {
  const [diff] = await db.update(diffs).set(review).where(eq(diffs.id, id)).returning();
  return diff;
};

export const allDoneForBuild = async (buildId: string) => {
  const rows = await db
    .select({ status: diffs.status })
    .from(diffs)
    .innerJoin(snapshots, eq(diffs.snapshotId, snapshots.id))
    .where(eq(snapshots.buildId, buildId));

  return rows.length > 0 && rows.every((row) => row.status !== "pending");
};

export type DiffDbSchema = Awaited<ReturnType<typeof findById>>;
