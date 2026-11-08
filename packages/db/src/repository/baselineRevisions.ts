import { and, asc, eq, gt } from "drizzle-orm";

import { db, type DbClient } from "../db";
import { baselineRevisions } from "../schema";
import { type BaselineKey, matchesBaselineKeys } from "./baselines";

type RevisionKey = {
  projectId: string;
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  targetId: string;
};

export const create = async (values: typeof baselineRevisions.$inferInsert, tx: DbClient = db) => {
  const [revision] = await tx.insert(baselineRevisions).values(values).returning();
  return revision;
};

// The first change main made to a target after `after`. Its previous snapshot is the
// baseline the target had at `after`.
export const findFirstAfter = async (
  { projectId, browser, viewportWidth, viewportHeight, targetId }: RevisionKey,
  after: string,
) => {
  const [revision] = await db
    .select()
    .from(baselineRevisions)
    .where(
      and(
        eq(baselineRevisions.projectId, projectId),
        eq(baselineRevisions.browser, browser),
        eq(baselineRevisions.viewportWidth, viewportWidth),
        eq(baselineRevisions.viewportHeight, viewportHeight),
        eq(baselineRevisions.targetId, targetId),
        gt(baselineRevisions.createdAt, after),
      ),
    )
    .orderBy(asc(baselineRevisions.createdAt), asc(baselineRevisions.id))
    .limit(1);
  return revision;
};

export const findFirstAfterByKeys = (projectId: string, keys: BaselineKey[], after: string) =>
  keys.length === 0
    ? Promise.resolve([])
    : db
        .selectDistinctOn([
          baselineRevisions.browser,
          baselineRevisions.viewportWidth,
          baselineRevisions.viewportHeight,
          baselineRevisions.targetId,
        ])
        .from(baselineRevisions)
        .where(
          and(
            matchesBaselineKeys(baselineRevisions, projectId, keys),
            gt(baselineRevisions.createdAt, after),
          ),
        )
        .orderBy(
          asc(baselineRevisions.browser),
          asc(baselineRevisions.viewportWidth),
          asc(baselineRevisions.viewportHeight),
          asc(baselineRevisions.targetId),
          asc(baselineRevisions.createdAt),
          asc(baselineRevisions.id),
        );

export type BaselineRevisionDbSchema = typeof baselineRevisions.$inferSelect;
