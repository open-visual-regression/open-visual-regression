import { createLogger } from "@ovr/logger";
import type { ProjectPurgeJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

const logger = createLogger("worker");

type ProjectPurgeJob = { data: ProjectPurgeJobPayload };

export const run = async (job: ProjectPurgeJob): Promise<void> => {
  await storage.deletePrefix(`${job.data.projectId}/`);
};

export const failed = async (job: ProjectPurgeJob, error?: Error): Promise<void> => {
  logger.error({ err: error, projectId: job.data.projectId }, "project purge job failed");
};
