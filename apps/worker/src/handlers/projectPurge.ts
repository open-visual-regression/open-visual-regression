import type { ProjectPurgeJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

type ProjectPurgeJob = { data: ProjectPurgeJobPayload };

export const run = async (job: ProjectPurgeJob): Promise<void> => {
  await storage.deletePrefix(`${job.data.projectId}/`);
};

export const failed = async (job: ProjectPurgeJob, error?: Error): Promise<void> => {
  console.error(`Project purge job failed for project ${job.data.projectId}:`, error);
};
