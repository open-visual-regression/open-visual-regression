import {
  type AnyColumn,
  and,
  asc,
  count,
  eq,
  exists,
  gte,
  inArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";

import { db } from "../db";
import { baselines, builds, flakySnapshots, projects, snapshots } from "../schema";
import type { SnapshotFlag } from "./snapshots";

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

export type BaselinesCursor = {
  targetTitle: string;
  targetName: string;
  browser: string;
  viewportWidth: number;
  id: string;
};

const isFlaky = exists(
  db
    .select({ id: flakySnapshots.id })
    .from(flakySnapshots)
    .where(
      and(
        eq(flakySnapshots.projectId, baselines.projectId),
        eq(flakySnapshots.browser, baselines.browser),
        eq(flakySnapshots.viewportWidth, baselines.viewportWidth),
        eq(flakySnapshots.viewportHeight, baselines.viewportHeight),
        eq(flakySnapshots.targetId, baselines.targetId),
      ),
    ),
).mapWith(Boolean);

const flagConditions: Record<SnapshotFlag, SQL> = {
  flaky: isFlaky,
  warning: eq(snapshots.hasUncaughtPageError, true),
};

const flagDisplayOrder: SnapshotFlag[] = ["flaky", "warning"];

export type ListForOrganizationFilters = {
  projectIds?: string[];
  flags?: SnapshotFlag[];
};

const listForOrganizationWhere = (
  organizationId: string,
  { projectIds, flags }: ListForOrganizationFilters = {},
) =>
  and(
    eq(projects.organizationId, organizationId),
    projectIds?.length ? inArray(baselines.projectId, projectIds) : undefined,
    flags?.length ? or(...flags.map((flag) => flagConditions[flag])) : undefined,
  );

const getCursorFilter = (cursor: BaselinesCursor) =>
  sql`(${snapshots.targetTitle}, ${snapshots.targetName}, ${snapshots.browser}, ${snapshots.viewportWidth}, ${snapshots.id})
      > (${cursor.targetTitle}::text, ${cursor.targetName}::text, ${cursor.browser}::text, ${cursor.viewportWidth}::int, ${cursor.id}::uuid)`;

export type ListForOrganizationOptions = ListForOrganizationFilters & {
  limit: number;
  cursor?: BaselinesCursor;
};

// Every project's current baseline snapshot, one per story, browser, and viewport.
export const listForOrganization = async (
  organizationId: string,
  { projectIds, flags, limit, cursor }: ListForOrganizationOptions,
) => {
  const rows = await db
    .select({
      id: snapshots.id,
      buildId: snapshots.buildId,
      projectId: projects.id,
      projectName: projects.name,
      targetId: snapshots.targetId,
      targetTitle: snapshots.targetTitle,
      targetName: snapshots.targetName,
      browser: snapshots.browser,
      viewportWidth: snapshots.viewportWidth,
      viewportHeight: snapshots.viewportHeight,
      viewportName: snapshots.viewportName,
      imagePath: snapshots.imagePath,
      hasUncaughtPageError: snapshots.hasUncaughtPageError,
      isFlaky,
    })
    .from(baselines)
    .innerJoin(snapshots, eq(snapshots.id, baselines.snapshotId))
    .innerJoin(projects, eq(projects.id, baselines.projectId))
    .where(
      and(
        listForOrganizationWhere(organizationId, { projectIds, flags }),
        cursor ? getCursorFilter(cursor) : undefined,
      ),
    )
    .orderBy(
      asc(snapshots.targetTitle),
      asc(snapshots.targetName),
      asc(snapshots.browser),
      asc(snapshots.viewportWidth),
      asc(snapshots.id),
    )
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows.at(-1);

  return {
    baselines: pageRows,
    nextCursor:
      hasMore && lastRow
        ? {
            targetTitle: lastRow.targetTitle,
            targetName: lastRow.targetName,
            browser: lastRow.browser,
            viewportWidth: lastRow.viewportWidth,
            id: lastRow.id,
          }
        : null,
  };
};

export const countForOrganization = async (
  organizationId: string,
  filters: ListForOrganizationFilters = {},
) => {
  const [result] = await db
    .select({ count: count() })
    .from(baselines)
    .innerJoin(snapshots, eq(snapshots.id, baselines.snapshotId))
    .innerJoin(projects, eq(projects.id, baselines.projectId))
    .where(listForOrganizationWhere(organizationId, filters));

  return result?.count ?? 0;
};

export const findFlagsForOrganization = async (organizationId: string): Promise<SnapshotFlag[]> => {
  const rows = await db
    .selectDistinct({ flaky: isFlaky, warning: snapshots.hasUncaughtPageError })
    .from(baselines)
    .innerJoin(snapshots, eq(snapshots.id, baselines.snapshotId))
    .innerJoin(projects, eq(projects.id, baselines.projectId))
    .where(listForOrganizationWhere(organizationId));

  return flagDisplayOrder.filter((flag) => rows.some((row) => row[flag]));
};
