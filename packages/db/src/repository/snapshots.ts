import { count, eq } from "drizzle-orm";

import { db } from "../db";
import { snapshots, type SnapshotStatus } from "../schema";

export const createMany = (values: (typeof snapshots.$inferInsert)[]) =>
  db.insert(snapshots).values(values).returning();

export const findByBuild = (buildId: string) =>
  db.query.snapshots.findMany({ where: (snapshots, { eq }) => eq(snapshots.buildId, buildId) });

export const updateStatus = async (id: string, status: SnapshotStatus) => {
  const [snapshot] = await db
    .update(snapshots)
    .set({ status })
    .where(eq(snapshots.id, id))
    .returning();
  return snapshot;
};

export const allCapturedForBuild = async (buildId: string) => {
  const rows = await db.query.snapshots.findMany({
    columns: { status: true },
    where: (snapshots, { eq }) => eq(snapshots.buildId, buildId),
  });
  return rows.every((row) => row.status !== "pending");
};

export const countByBuild = async (buildId: string) => {
  const [result] = await db
    .select({ count: count() })
    .from(snapshots)
    .where(eq(snapshots.buildId, buildId));
  return result?.count ?? 0;
};

export type SnapshotDbSchema = Awaited<ReturnType<typeof findByBuild>>[number];
