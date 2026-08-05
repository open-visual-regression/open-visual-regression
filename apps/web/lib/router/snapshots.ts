"use server";

import { dbClient } from "@ovr/db/client";

import {
  authenticatedMiddleware,
  organizationBuildMiddleware,
  organizationSnapshotMiddleware,
} from "./middleware";
import { os } from "./os";
import { getSnapshotDisplayStatus } from "./utils/snapshotStatus";

export const getOne = os.snapshots.getOne
  .use(authenticatedMiddleware)
  .use(organizationSnapshotMiddleware)
  .handler(async ({ context }) => {
    const { snapshot } = context;

    const [errorLogs, diff] = await Promise.all([
      dbClient.snapshotLogs.findBySnapshot(snapshot.id),
      dbClient.diffs.findBySnapshot(snapshot.id),
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
  .use(authenticatedMiddleware)
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
  .use(authenticatedMiddleware)
  .use(organizationBuildMiddleware)
  .handler(async ({ input }) => dbClient.snapshots.getDisplayStatusCounts(input.buildId))
  .actionable();

export const getAdjacent = os.snapshots.getAdjacent
  .use(authenticatedMiddleware)
  .use(organizationSnapshotMiddleware)
  .handler(async ({ context }) => {
    const { snapshot } = context;

    const { prevId, nextId, position, total } = await dbClient.snapshots.findAdjacentReviewableIds(
      snapshot.buildId,
      snapshot.id,
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
