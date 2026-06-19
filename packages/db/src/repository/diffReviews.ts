import { and, eq, sql } from "drizzle-orm";

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

export const removeVote = async (diffId: string, reviewerId: string) => {
  await db
    .delete(diffReviews)
    .where(and(eq(diffReviews.diffId, diffId), eq(diffReviews.reviewerId, reviewerId)));
};

export const findByDiff = (diffId: string) =>
  db.query.diffReviews.findMany({
    where: (diffReviews, { eq }) => eq(diffReviews.diffId, diffId),
  });

export type DiffReviewDbSchema = Awaited<ReturnType<typeof findByDiff>>[number];
