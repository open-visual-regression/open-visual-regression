import { sql } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { backfills, type BackfillName } from "../schema";
import { copyBaselinesFromDiffs } from "./snapshots";

export const find = (name: BackfillName) =>
  db.query.backfills.findFirst({
    where: (backfills, { eq }) => eq(backfills.name, name),
  });

export const saveCursor = async (name: BackfillName, cursor: string, tx: DbClient = db) => {
  await tx
    .insert(backfills)
    .values({ name, cursor })
    .onConflictDoUpdate({ target: backfills.name, set: { cursor, updatedAt: sql`now()` } });
};

export const complete = async (name: BackfillName) => {
  await db
    .insert(backfills)
    .values({ name, completedAt: sql`now()` })
    .onConflictDoUpdate({
      target: backfills.name,
      set: { completedAt: sql`now()`, updatedAt: sql`now()` },
    });
};

// One batch of the snapshot baseline backfill, saved together with how far it got. Waits at most
// `lockTimeoutMs` on a row lock the app holds before failing, so it never stalls the app.
export const copySnapshotBaselinesBatch = (
  afterDiffId: string | null,
  limit: number,
  lockTimeoutMs: number,
) =>
  db.transaction(async (tx) => {
    await tx.execute(sql.raw(`SET LOCAL lock_timeout = ${Math.trunc(lockTimeoutMs)}`));
    const batch = await copyBaselinesFromDiffs(afterDiffId, limit, tx);
    if (batch.lastDiffId) {
      await saveCursor("snapshot_baselines", batch.lastDiffId, tx);
    }
    return batch;
  });

export type BackfillDbSchema = NonNullable<Awaited<ReturnType<typeof find>>>;
