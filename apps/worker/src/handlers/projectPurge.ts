import { createLogger } from "@ovr/logger";
import type { ProjectPurgeJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

const logger = createLogger("worker");

type ProjectPurgeJob = { data: ProjectPurgeJobPayload };

export const run = async (job: ProjectPurgeJob): Promise<void> => {
  const startedAt = Date.now();
  const { deletedCount } = await storage.deletePrefix(`${job.data.projectId}/`, {
    reason: "project_purge",
  });

  logger.info(
    {
      projectId: job.data.projectId,
      objectsDeleted: deletedCount,
      durationMs: Date.now() - startedAt,
    },
    "purged storage for deleted project",
  );
};

export const failed = async (job: ProjectPurgeJob, error?: Error): Promise<void> => {
  logger.error({ err: error, projectId: job.data.projectId }, "project purge job failed");
};
