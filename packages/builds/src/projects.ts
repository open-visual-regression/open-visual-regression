import { dbClient } from "@ovr/db/client";
import { createLogger } from "@ovr/logger";
import { enqueueProjectPurge } from "@ovr/queue/producer";

import type { Result } from "./types";

const logger = createLogger("projects");

export const deleteProject = async (
  projectId: string,
  organizationId: string,
): Promise<Result<void, "PROJECT_NOT_FOUND">> => {
  const deleted = await dbClient.transaction(async (tx) => {
    const removed = await dbClient.projects.deleteProject(projectId, organizationId, tx);

    if (!removed) {
      return null;
    }

    await dbClient.storageOutbox.removeByProject(tx, projectId);

    return removed;
  });

  if (!deleted) {
    return { status: "error", error: "PROJECT_NOT_FOUND" };
  }

  try {
    await enqueueProjectPurge({ projectId });
  } catch (error) {
    logger.error({ err: error, projectId }, "failed to enqueue project storage purge");
  }

  return { status: "ok", data: undefined };
};
