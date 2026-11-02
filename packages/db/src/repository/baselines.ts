import { type AnyColumn, and, eq, gte, inArray, lt, max, sql } from "drizzle-orm";

import { db } from "../db";
import { baselines, builds, projects, snapshots } from "../schema";

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
        lastSeenAt: sql`now()`,
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

// Records that a main-branch build still has these stories, so retention keeps their
// baselines. Any snapshot row counts, including skipped ones (--only-affected), and a story
// that failed to load keeps every viewport's baseline, since its row only carries one viewport.
export const markSeenInMainBuild = async (buildId: string): Promise<void> => {
  const mainBuild = db
    .select({ id: builds.id, projectId: builds.projectId })
    .from(builds)
    .innerJoin(projects, eq(projects.id, builds.projectId))
    .where(and(eq(builds.id, buildId), eq(builds.branch, projects.gitMainBranch)));

  await db.execute(sql`
    with main_build as (${mainBuild})
    update ${baselines} set last_seen_at = now()
    from ${snapshots}, main_build
    where ${snapshots.buildId} = main_build.id
      and ${baselines.projectId} = main_build.project_id
      and ${baselines.browser} = ${snapshots.browser}
      and ${baselines.viewportWidth} = ${snapshots.viewportWidth}
      and ${baselines.viewportHeight} = ${snapshots.viewportHeight}
      and ${baselines.targetId} = ${snapshots.targetId}
  `);

  await db.execute(sql`
    with main_build as (${mainBuild})
    update ${baselines} set last_seen_at = now()
    from ${snapshots}, main_build
    where ${snapshots.buildId} = main_build.id
      and ${snapshots.status} = 'error'
      and ${baselines.projectId} = main_build.project_id
      and ${baselines.targetId} = ${snapshots.targetId}
  `);
};

// Deletes up to `limit` baselines no main-branch build has had for `unseenDays`, counted back
// from the project's most recently seen baseline rather than from now, so a project whose
// main branch stops building keeps its baselines.
export const removeUnseenPage = async (
  projectId: string,
  unseenDays: number,
  limit: number,
): Promise<number> => {
  const cutoff = sql`(${db
    .select({ lastSeenAt: max(baselines.lastSeenAt) })
    .from(baselines)
    .where(eq(baselines.projectId, projectId))}) - make_interval(days => ${unseenDays})`;
  const unseen = and(eq(baselines.projectId, projectId), lt(baselines.lastSeenAt, cutoff));

  // The outer filter is re-checked against a row a concurrent build marks seen mid-delete.
  const removed = await db
    .delete(baselines)
    .where(
      and(
        unseen,
        inArray(
          baselines.id,
          db
            .select({ id: baselines.id })
            .from(baselines)
            .where(unseen)
            .orderBy(baselines.lastSeenAt)
            .limit(limit),
        ),
      ),
    )
    .returning({ id: baselines.id });

  return removed.length;
};
