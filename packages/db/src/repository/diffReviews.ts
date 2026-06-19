import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "../db";
import { diffReviews } from "../schema";

export const upsertVote = async (values: typeof diffReviews.$inferInsert) => {
  const [vote] = await db
    .insert(diffReviews)
    .values(values)
    .onConflictDoUpdate({
      target: [diffReviews.diffId, diffReviews.reviewerId],
      set: { vote: values.vote, reviewedAt: sql`now()` },
    })
    .returning();
  return vote;
};

export const upsertVotes = async (values: (typeof diffReviews.$inferInsert)[]) => {
  if (values.length === 0) {
    return [];
  }

  return db
    .insert(diffReviews)
    .values(values)
    .onConflictDoUpdate({
      target: [diffReviews.diffId, diffReviews.reviewerId],
      set: { vote: sql`excluded.vote`, reviewedAt: sql`now()` },
    })
    .returning();
};

export const removeVote = async (diffId: string, reviewerId: string) => {
  await db
    .delete(diffReviews)
    .where(and(eq(diffReviews.diffId, diffId), eq(diffReviews.reviewerId, reviewerId)));
};

export const findByDiff = (diffId: string) =>
  db.query.diffReviews.findMany({
    where: (diffReviews, { eq }) => eq(diffReviews.diffId, diffId),
  });

export const findByDiffs = (diffIds: string[]) => {
  if (diffIds.length === 0) {
    return Promise.resolve([]);
  }

  return db.query.diffReviews.findMany({
    where: inArray(diffReviews.diffId, diffIds),
  });
};

export type DiffReviewDbSchema = Awaited<ReturnType<typeof findByDiff>>[number];
