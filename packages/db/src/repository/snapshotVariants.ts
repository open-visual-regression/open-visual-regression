import { and, desc, eq, sql } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { snapshots, snapshotVariants } from "../schema";

type VariantKey = {
  projectId: string;
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  targetId: string;
};

export const findRecentForKey = (
  { projectId, browser, viewportWidth, viewportHeight, targetId }: VariantKey,
  limit: number,
) =>
  db
    .select({
      id: snapshotVariants.id,
      imageHash: snapshotVariants.imageHash,
      imagePath: snapshots.imagePath,
    })
    .from(snapshotVariants)
    .innerJoin(snapshots, eq(snapshots.id, snapshotVariants.snapshotId))
    .where(
      and(
        eq(snapshotVariants.projectId, projectId),
        eq(snapshotVariants.browser, browser),
        eq(snapshotVariants.viewportWidth, viewportWidth),
        eq(snapshotVariants.viewportHeight, viewportHeight),
        eq(snapshotVariants.targetId, targetId),
      ),
    )
    .orderBy(desc(snapshotVariants.lastSeenAt))
    .limit(limit);

export const create = async (values: typeof snapshotVariants.$inferInsert, tx: DbClient = db) => {
  const [variant] = await tx.insert(snapshotVariants).values(values).returning();
  return variant;
};

export const recordSighting = async (
  id: string,
  { snapshotId, imageHash }: Pick<typeof snapshotVariants.$inferInsert, "snapshotId" | "imageHash">,
  tx: DbClient = db,
) => {
  const [variant] = await tx
    .update(snapshotVariants)
    .set({ snapshotId, imageHash, lastSeenAt: sql`now()` })
    .where(eq(snapshotVariants.id, id))
    .returning();
  return variant;
};
