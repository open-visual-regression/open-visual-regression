"use server";

import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";

import { os } from "./os";
import { authenticatedMiddleware } from "./middleware";
import { getAuthorizedSnapshot } from "./snapshotAuthz";

export const getOne = os.snapshots.getOne
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const { snapshot } = await getAuthorizedSnapshot(input.snapshotId, context.organizationId);

    const [captureConfiguration, errorLogs] = await Promise.all([
      dbClient.captureConfigurations.findById(snapshot.captureConfigurationId),
      dbClient.snapshotLogs.findBySnapshot(snapshot.id),
    ]);

    if (!captureConfiguration) {
      throw new ORPCError("NOT_FOUND");
    }

    return {
      snapshot: {
        id: snapshot.id,
        targetName: snapshot.targetName,
        targetTitle: snapshot.targetTitle,
        imagePath: snapshot.imagePath,
        captureConfiguration: {
          id: captureConfiguration.id,
          name: captureConfiguration.name,
          browser: captureConfiguration.browser,
          viewportWidth: captureConfiguration.viewportWidth,
          viewportHeight: captureConfiguration.viewportHeight,
        },
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
