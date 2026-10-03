import { type AnyColumn, eq, gte } from "drizzle-orm";

import { db } from "../db";
import { baselines, builds, snapshots } from "../schema";

type FindInput = {
  projectId: string;
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  targetId: string;
};

export const find = ({ projectId, browser, viewportWidth, viewportHeight, targetId }: FindInput) =>
  db.query.baselines.findFirst({
    where: (baselines, { and, eq }) =>
      and(
        eq(baselines.projectId, projectId),
        eq(baselines.browser, browser),
        eq(baselines.viewportWidth, viewportWidth),
        eq(baselines.viewportHeight, viewportHeight),
        eq(baselines.targetId, targetId),
      ),
  });

const selectBuildCreatedAt = (snapshotId: string | AnyColumn) =>
  db
    .select({ createdAt: builds.createdAt })
    .from(snapshots)
    .innerJoin(builds, eq(builds.id, snapshots.buildId))
    .where(eq(snapshots.id, snapshotId));

const getNotOlderBuildFilter = (snapshotId: string) =>
  gte(selectBuildCreatedAt(snapshotId), selectBuildCreatedAt(baselines.snapshotId));

export const upsert = async (values: typeof baselines.$inferInsert) => {
  const [baseline] = await db
    .insert(baselines)
    .values(values)
    .onConflictDoUpdate({
      target: [
        baselines.projectId,
        baselines.browser,
        baselines.viewportWidth,
        baselines.viewportHeight,
        baselines.targetId,
      ],
      set: {
        snapshotId: values.snapshotId,
        approvedAt: values.approvedAt,
        approvedBy: values.approvedBy,
      },
      setWhere: getNotOlderBuildFilter(values.snapshotId),
    })
    .returning();
  return baseline;
};

export const findByProject = (projectId: string) =>
  db.query.baselines.findMany({
    where: (baselines, { eq }) => eq(baselines.projectId, projectId),
  });

export type BaselineDbSchema = Awaited<ReturnType<typeof findByProject>>[number];
