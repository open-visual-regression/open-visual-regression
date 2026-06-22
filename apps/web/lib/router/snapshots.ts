"use server";

import { dbClient } from "@ovr/db/client";

import { os } from "./os";
import { authenticatedMiddleware, organizationSnapshotMiddleware } from "./middleware";
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
        targetName: snapshot.targetName,
        targetTitle: snapshot.targetTitle,
        imagePath: snapshot.imagePath,
        browser: snapshot.browser,
        viewportWidth: snapshot.viewportWidth,
        viewportHeight: snapshot.viewportHeight === 0 ? null : snapshot.viewportHeight,
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
