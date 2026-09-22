"use server";

import { ORPCError } from "@orpc/client";

import {
  checkSnapshotsRebuildable,
  rebuildSnapshots as rebuildSnapshotsService,
  type SnapshotRebuildBlockedReason,
} from "@ovr/builds/builds";
import { dbClient } from "@ovr/db/client";

import {
  authenticatedMiddleware,
  callerMiddleware,
  organizationBuildMiddleware,
  organizationSnapshotMiddleware,
  reviewerMiddleware,
} from "./middleware";
import { os } from "./os";
import { getSnapshotDisplayStatus } from "./utils/snapshotStatus";

export const getOne = os.snapshots.getOne
  .use(callerMiddleware("builds", "read"))
  .use(organizationSnapshotMiddleware)
  .handler(async ({ context }) => {
    const { snapshot, build } = context;

    const [errorLogs, diff, rebuildable] = await Promise.all([
      dbClient.snapshotLogs.findBySnapshot(snapshot.id),
      dbClient.diffs.findBySnapshot(snapshot.id),
      checkSnapshotsRebuildable(build, [snapshot]),
    ]);

    return {
      snapshot: {
        id: snapshot.id,
        targetId: snapshot.targetId,
        targetName: snapshot.targetName,
        targetTitle: snapshot.targetTitle,
        imagePath: snapshot.imagePath,
        browser: snapshot.browser,
        viewportWidth: snapshot.viewportWidth,
        viewportHeight: snapshot.viewportHeight === 0 ? null : snapshot.viewportHeight,
        viewportName: snapshot.viewportName,
        status: getSnapshotDisplayStatus(snapshot, diff),
        hasUncaughtPageError: snapshot.hasUncaughtPageError,
        errorMessage: snapshot.errorMessage,
        isRebuildable: rebuildable.status === "ok",
        errorLogs: errorLogs.map((log) => ({
          id: log.id,
          level: log.level,
          message: log.message,
          timestamp: log.timestamp,
        })),
      },
    };
  })
  .actionable();

export const list = os.snapshots.list
  .use(callerMiddleware("builds", "read"))
  .use(organizationBuildMiddleware)
  .handler(async ({ input }) => {
    const { buildId, statuses, browsers, viewports, search, limit, cursor } = input;

    const [{ snapshots: rows, nextCursor }, total] = await Promise.all([
      dbClient.snapshots.listForBuild(buildId, {
        statuses,
        browsers,
        viewports,
        search,
        limit,
        cursor,
      }),
      dbClient.snapshots.countForBuild(buildId, { statuses, browsers, viewports, search }),
    ]);

    return {
      snapshots: rows.map((row) => ({
        id: row.id,
        targetId: row.targetId,
        targetTitle: row.targetTitle,
        targetName: row.targetName,
        status: row.status,
        imagePath: row.imagePath,
        diffId: row.diffId,
        diffImagePath: row.diffImagePath,
        diffPercent: row.diffPercent,
        browser: row.browser,
        viewportWidth: row.viewportWidth,
        viewportHeight: row.viewportHeight === 0 ? null : row.viewportHeight,
        viewportName: row.viewportName,
      })),
      total,
      nextCursor,
    };
  })
  .actionable();

export const getCounts = os.snapshots.getCounts
  .use(callerMiddleware("builds", "read"))
  .use(organizationBuildMiddleware)
  .handler(async ({ input }) => dbClient.snapshots.getDisplayStatusCounts(input.buildId))
  .actionable();

export const getAdjacent = os.snapshots.getAdjacent
  .use(authenticatedMiddleware)
  .use(organizationSnapshotMiddleware)
  .handler(async ({ input, context }) => {
    const { snapshot } = context;
    const { statuses, browsers, viewports, search } = input;

    const { prevId, nextId, position, total } = await dbClient.snapshots.findAdjacentIds(
      snapshot.buildId,
      snapshot.id,
      { statuses, browsers, viewports, search },
    );

    return { prevSnapshotId: prevId, nextSnapshotId: nextId, position, total };
  })
  .actionable();

export const listStatuses = os.snapshots.listStatuses
  .use(authenticatedMiddleware)
  .use(organizationBuildMiddleware)
  .handler(async ({ input }) => ({
    statuses: await dbClient.snapshots.findStatuses(input.buildId),
  }))
  .actionable();

export const listBrowsers = os.snapshots.listBrowsers
  .use(authenticatedMiddleware)
  .use(organizationBuildMiddleware)
  .handler(async ({ input }) => ({
    browsers: await dbClient.snapshots.findBrowsers(input.buildId),
  }))
  .actionable();

export const listViewports = os.snapshots.listViewports
  .use(authenticatedMiddleware)
  .use(organizationBuildMiddleware)
  .handler(async ({ input }) => ({
    viewports: await dbClient.snapshots.findViewports(input.buildId),
  }))
  .actionable();

const REBUILD_ERROR_MESSAGES: Record<SnapshotRebuildBlockedReason | "ARTIFACT_MISSING", string> = {
  NOT_SETTLED: "this build is still running",
  BUILD_CANCELED: "this build was canceled",
  NOT_LATEST_ON_BRANCH: "a newer build has landed on this branch",
  SNAPSHOT_SKIPPED: "this story is skipped",
  ARTIFACT_MISSING: "this build's storybook has been cleaned up",
};

export const rebuild = os.snapshots.rebuild
  .use(authenticatedMiddleware)
  .use(reviewerMiddleware)
  .use(organizationBuildMiddleware)
  .handler(async ({ input, context }) => {
    const result = await rebuildSnapshotsService(
      context.build.id,
      input.snapshotIds,
      context.user.id,
    );

    if (result.status === "error") {
      if (result.error === "BUILD_NOT_FOUND" || result.error === "SNAPSHOT_NOT_FOUND") {
        throw new ORPCError("NOT_FOUND");
      }

      throw new ORPCError(
        result.error === "ARTIFACT_MISSING" ? "PRECONDITION_FAILED" : "CONFLICT",
        { message: REBUILD_ERROR_MESSAGES[result.error] },
      );
    }

    return { ok: true as const };
  })
  .actionable();
