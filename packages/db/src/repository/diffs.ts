import { and, eq, exists, inArray, isNull, ne, notExists, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db, type DbClient } from "../db";
import {
  builds,
  diffs,
  snapshots,
  type DiffProcessingStatus,
  type DiffReviewStatus,
} from "../schema";

export const create = async (values: typeof diffs.$inferInsert) => {
  const [diff] = await db.insert(diffs).values(values).returning();
  return diff;
};

type CreateManyInput = { values: (typeof diffs.$inferInsert)[]; tx?: DbClient };

export const createMany = async ({ values, tx = db }: CreateManyInput) => {
  if (values.length === 0) {
    return [];
  }

  return tx.insert(diffs).values(values).onConflictDoNothing().returning();
};

export const findById = (id: string) =>
  db.query.diffs.findFirst({ where: (diffs, { eq }) => eq(diffs.id, id) });

export const findBySnapshot = (snapshotId: string) =>
  db.query.diffs.findFirst({ where: (diffs, { eq }) => eq(diffs.snapshotId, snapshotId) });

export const findBySnapshotWithBaseline = async (snapshotId: string) => {
  const baselineSnapshots = alias(snapshots, "baseline_snapshots");

  const [row] = await db
    .select({ diff: diffs, baselineSnapshot: baselineSnapshots })
    .from(diffs)
    .leftJoin(baselineSnapshots, eq(diffs.baselineSnapshotId, baselineSnapshots.id))
    .where(eq(diffs.snapshotId, snapshotId));

  return row;
};

type FindByBuildOptions = {
  processingStatus?: DiffProcessingStatus;
};

export const findByBuild = async (buildId: string, opts: FindByBuildOptions = {}) => {
  const rows = await db
    .select({ diff: diffs, diffThreshold: snapshots.diffThreshold })
    .from(diffs)
    .innerJoin(snapshots, eq(diffs.snapshotId, snapshots.id))
    .where(
      and(
        eq(snapshots.buildId, buildId),
        opts.processingStatus ? eq(diffs.processingStatus, opts.processingStatus) : undefined,
      ),
    );

  return rows.map((row) => ({ ...row.diff, diffThreshold: row.diffThreshold }));
};

export const updateProcessingStatus = async (
  id: string,
  processingStatus: DiffProcessingStatus,
) => {
  const [diff] = await db
    .update(diffs)
    .set({ processingStatus })
    .where(and(eq(diffs.id, id), ne(diffs.processingStatus, "canceled")))
    .returning();
  return diff;
};

type UpdateResultInput = {
  processingStatus: DiffProcessingStatus;
  reviewStatus: DiffReviewStatus;
  diffImagePath?: string;
  pixelDiffCount?: number;
  diffPercent?: number;
  baselineSnapshotId?: string;
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

export const removeBySnapshot = async (snapshotId: string, tx: DbClient = db): Promise<void> => {
  await tx.delete(diffs).where(eq(diffs.snapshotId, snapshotId));
};

export const findPendingIds = async (buildId: string, tx: DbClient = db): Promise<string[]> => {
  const rows = await tx
    .select({ id: diffs.id })
    .from(diffs)
    .innerJoin(snapshots, eq(diffs.snapshotId, snapshots.id))
    .where(and(eq(snapshots.buildId, buildId), eq(diffs.processingStatus, "pending")));

  return rows.map((row) => row.id);
};

export const markPendingAs = async (
  buildId: string,
  status: DiffProcessingStatus,
  tx: DbClient = db,
): Promise<string[]> => {
  const ids = await findPendingIds(buildId, tx);
  if (ids.length === 0) {
    return ids;
  }

  await tx.update(diffs).set({ processingStatus: status }).where(inArray(diffs.id, ids));
  return ids;
};

const capturedSnapshotsOf = (buildId: string) =>
  and(eq(snapshots.buildId, buildId), ne(snapshots.status, "skipped"));

// Captured snapshots still waiting on a capture or a diff.
const pendingSnapshotsOf = (buildId: string) =>
  db
    .select({ one: sql`1` })
    .from(snapshots)
    .leftJoin(diffs, eq(diffs.snapshotId, snapshots.id))
    .where(
      and(
        capturedSnapshotsOf(buildId),
        or(isNull(diffs.processingStatus), eq(diffs.processingStatus, "pending")),
      ),
    );

export const hasAllDoneForBuild = async (buildId: string) => {
  const [row] = await db
    .select({ id: builds.id })
    .from(builds)
    .where(
      and(
        eq(builds.id, buildId),
        exists(
          db
            .select({ one: sql`1` })
            .from(snapshots)
            .where(capturedSnapshotsOf(buildId)),
        ),
        notExists(pendingSnapshotsOf(buildId)),
      ),
    );

  return row !== undefined;
};

export const hasPendingForBuild = async (buildId: string): Promise<boolean> => {
  const [row] = await pendingSnapshotsOf(buildId).limit(1);
  return row !== undefined;
};

export type DiffDbSchema = Awaited<ReturnType<typeof findById>>;
