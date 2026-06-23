import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { mapWithConcurrency } from "./lib/concurrency";
import { enqueuePurge } from "./lib/queue";

const RETENTION_PAGE_SIZE = 500;
const STORAGE_DELETE_CONCURRENCY = 10;
const MAX_PAGES_PER_RUN = 200;

const getBuildPrefix = (projectId: string, buildId: string): string =>
  `${projectId}/builds/${buildId}/`;

export const dispatchPurgeJobs = async (): Promise<void> => {
  const organizations = await dbClient.organizations.findAll();

  for (const organization of organizations) {
    const projects = await dbClient.projects.listProjects({ organizationId: organization.id });

    for (const project of projects) {
      await enqueuePurge({ projectId: project.id });
    }
  }
};

export const purgeExpiredBuilds = async (projectId: string): Promise<void> => {
  const project = await dbClient.projects.findById(projectId);

  if (!project) {
    return;
  }

  const cutoff = new Date(Date.now() - project.retentionDays * 24 * 60 * 60 * 1000).toISOString();

  for (let page = 0; page < MAX_PAGES_PER_RUN; page++) {
    const buildIds = await dbClient.builds.findExpiredPage(projectId, cutoff, RETENTION_PAGE_SIZE);

    if (buildIds.length === 0) {
      return;
    }

    await dbClient.builds.removeMany(buildIds);

    await mapWithConcurrency(buildIds, STORAGE_DELETE_CONCURRENCY, (buildId) =>
      storage.deletePrefix(getBuildPrefix(projectId, buildId)),
    );

    if (buildIds.length < RETENTION_PAGE_SIZE) {
      return;
    }
  }
};
