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

const reviewerColumns = { id: true, name: true, image: true } as const;

export type DiffReviewDbSchema = typeof diffReviews.$inferSelect;

export type DiffReviewWithReviewerDbSchema = DiffReviewDbSchema & {
  reviewer: { id: string; name: string; image: string | null };
};

export type FindByDiffOptions = { withReviewers?: boolean };

export function findByDiff(diffId: string): Promise<DiffReviewDbSchema[]>;
export function findByDiff(
  diffId: string,
  options: { withReviewers: true },
): Promise<DiffReviewWithReviewerDbSchema[]>;
export function findByDiff(
  diffId: string,
  options: FindByDiffOptions = {},
): Promise<DiffReviewDbSchema[] | DiffReviewWithReviewerDbSchema[]> {
  return db.query.diffReviews.findMany({
    where: eq(diffReviews.diffId, diffId),
    orderBy: (diffReviews, { asc }) => asc(diffReviews.reviewedAt),
    with: options.withReviewers ? { reviewer: { columns: reviewerColumns } } : undefined,
  });
}

export const findByDiffs = (diffIds: string[]) => {
  if (diffIds.length === 0) {
    return Promise.resolve([]);
  }

  return db.query.diffReviews.findMany({
    where: inArray(diffReviews.diffId, diffIds),
  });
};
