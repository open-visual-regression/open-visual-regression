import { db, type DbClient } from "../db";
import { snapshotLogs } from "../schema";

type CreateManyInput = { values: (typeof snapshotLogs.$inferInsert)[]; tx?: DbClient };

export const createMany = async ({ values, tx = db }: CreateManyInput) => {
  if (values.length === 0) {
    return [];
  }

  return tx.insert(snapshotLogs).values(values).returning();
};

export const findBySnapshot = (snapshotId: string) =>
  db.query.snapshotLogs.findMany({
    where: (snapshotLogs, { eq }) => eq(snapshotLogs.snapshotId, snapshotId),
  });
