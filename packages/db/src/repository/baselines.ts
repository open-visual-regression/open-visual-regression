import { type AnyColumn, eq, gte, sql } from "drizzle-orm";

import { db, type DbClient } from "../db";
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

// Resolves to undefined when a newer build already set this baseline.
export const upsert = async (values: typeof baselines.$inferInsert, tx: DbClient = db) => {
  const [baseline] = await tx
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

export type BaselineKey = {
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  targetId: string;
};

export type ComparisonCandidates = BaselineKey & {
  latestSnapshotId: string | null;
  // Main's first change to the target after `after`, if there was one.
  revision: { replacedExisting: boolean; previousSnapshotId: string | null } | null;
};

const toKeyRow = (key: BaselineKey) => ({
  browser: key.browser,
  viewport_width: key.viewportWidth,
  viewport_height: key.viewportHeight,
  target_id: key.targetId,
});

// Bounds the size of one query's key list.
const COMPARISON_CANDIDATES_CHUNK = 1000;

// For each key, main's latest baseline and main's first change after `after`: what
// `findComparisonBaseline` decides between. One indexed lookup per key, in one query per chunk.
export const findComparisonCandidates = async (
  projectId: string,
  keys: BaselineKey[],
  after: string | null,
): Promise<ComparisonCandidates[]> => {
  const results: ComparisonCandidates[] = [];

  for (let start = 0; start < keys.length; start += COMPARISON_CANDIDATES_CHUNK) {
    const chunk = keys.slice(start, start + COMPARISON_CANDIDATES_CHUNK);
    const { rows } = await db.execute<{
      browser: string;
      viewport_width: number;
      viewport_height: number;
      target_id: string;
      latest_snapshot_id: string | null;
      revision_id: string | null;
      replaced_existing: boolean | null;
      previous_snapshot_id: string | null;
    }>(sql`
      select k.browser, k.viewport_width, k.viewport_height, k.target_id,
        b.snapshot_id as latest_snapshot_id,
        r.id as revision_id, r.replaced_existing, r.previous_snapshot_id
      from jsonb_to_recordset(${JSON.stringify(chunk.map(toKeyRow))}::jsonb)
        as k(browser text, viewport_width int, viewport_height int, target_id text)
      -- Lateral with a limit, so each key is an index probe. A join, or a lateral Postgres can
      -- flatten into one, may hash every baseline instead.
      left join lateral (
        select b.snapshot_id
        from baselines b
        where b.project_id = ${projectId}
          and b.browser = k.browser
          and b.viewport_width = k.viewport_width
          and b.viewport_height = k.viewport_height
          and b.target_id = k.target_id
        limit 1
      ) b on true
      left join lateral (
        select r.id, r.replaced_existing, r.previous_snapshot_id
        from baseline_revisions r
        where r.project_id = ${projectId}
          and r.browser = k.browser
          and r.viewport_width = k.viewport_width
          and r.viewport_height = k.viewport_height
          and r.target_id = k.target_id
          and r.created_at > ${after}::timestamp
        order by r.created_at, r.id
        limit 1
      ) r on true
    `);

    for (const row of rows) {
      results.push({
        browser: row.browser,
        viewportWidth: row.viewport_width,
        viewportHeight: row.viewport_height,
        targetId: row.target_id,
        latestSnapshotId: row.latest_snapshot_id,
        revision: row.revision_id
          ? {
              replacedExisting: row.replaced_existing ?? false,
              previousSnapshotId: row.previous_snapshot_id,
            }
          : null,
      });
    }
  }

  return results;
};

export type BaselineDbSchema = Awaited<ReturnType<typeof findByProject>>[number];
