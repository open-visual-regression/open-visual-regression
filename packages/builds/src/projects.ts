import { dbClient } from "@ovr/db/client";
import { createLogger } from "@ovr/logger";
import { enqueueProjectPurge } from "@ovr/queue/producer";

import type { Result } from "./types";

const logger = createLogger("projects");

// Deleting a project removes the project row (Postgres cascades its builds,
// snapshots, diffs, baselines, ...) and its storage_outbox rows, which carry no
// foreign key and would otherwise be orphaned. Object storage is purged
// asynchronously by the worker: the delete could span thousands of objects, and
// deferring it keeps the request bounded and lets a transient failure retry.
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
    // The project is already gone; a failed enqueue only leaves orphaned objects
    // in storage, so log it rather than failing the deletion.
    logger.error({ err: error, projectId }, "failed to enqueue project storage purge");
  }

  return { status: "ok", data: undefined };
};
