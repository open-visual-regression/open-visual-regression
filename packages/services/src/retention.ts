import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { mapWithConcurrency } from "./lib/concurrency";
import { enqueuePurgeMany } from "./lib/queue";

const RETENTION_PAGE_SIZE = 500;
const STORAGE_DELETE_CONCURRENCY = 10;
const MAX_PAGES_PER_RUN = 200;
const ORGANIZATION_PROJECTS_PAGE_SIZE = 500;

const getBuildPrefix = (projectId: string, buildId: string): string =>
  `${projectId}/builds/${buildId}/`;

const dispatchPurgeJobsForOrganizationPage = async (
  organizationId: string,
  offset: number,
): Promise<void> => {
  const projects = await dbClient.projects.listProjects({
    organizationId,
    limit: ORGANIZATION_PROJECTS_PAGE_SIZE,
    offset,
  });

  await enqueuePurgeMany(projects.map((project) => ({ projectId: project.id })));

  if (projects.length === ORGANIZATION_PROJECTS_PAGE_SIZE) {
    await dispatchPurgeJobsForOrganizationPage(
      organizationId,
      offset + ORGANIZATION_PROJECTS_PAGE_SIZE,
    );
  }
};

export const dispatchPurgeJobs = async (): Promise<void> => {
  const organizations = await dbClient.organizations.findAll();
  const errors: unknown[] = [];

  for (const organization of organizations) {
    try {
      await dispatchPurgeJobsForOrganizationPage(organization.id, 0);
    } catch (error) {
      console.error(`Failed to dispatch purge jobs for organization ${organization.id}:`, error);
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(
      errors,
      `Failed to dispatch purge jobs for ${errors.length} of ${organizations.length} organization(s)`,
    );
  }
};

const drainStorageOutbox = async (projectId: string): Promise<void> => {
  const pending = await dbClient.storageOutbox.findByProject(projectId);

  if (pending.length === 0) {
    return;
  }

  const results = await mapWithConcurrency(pending, STORAGE_DELETE_CONCURRENCY, async (entry) => {
    try {
      await storage.deletePrefix(entry.prefix);
      await dbClient.storageOutbox.remove(entry.id);
      return { entry, ok: true as const };
    } catch (error) {
      return { entry, ok: false as const, error };
    }
  });

  const failures = results.filter((result) => !result.ok);

  if (failures.length > 0) {
    console.error(
      `purgeExpiredBuilds: failed to delete storage for ${failures.length} purged build(s) in ` +
        `project ${projectId} (will retry on the next run): ` +
        failures.map((failure) => failure.entry.prefix).join(", "),
      failures.map((failure) => failure.error),
    );
  }
};

export const purgeExpiredBuilds = async (projectId: string): Promise<void> => {
  const project = await dbClient.projects.findById(projectId);

  if (!project) {
    return;
  }

  // Retry storage deletes left over from a previous run before paging through new ones.
  await drainStorageOutbox(projectId);

  const cutoff = new Date(Date.now() - project.retentionDays * 24 * 60 * 60 * 1000).toISOString();

  for (let page = 0; page < MAX_PAGES_PER_RUN; page++) {
    const buildIds = await dbClient.builds.findExpiredPage(projectId, cutoff, RETENTION_PAGE_SIZE);

    if (buildIds.length === 0) {
      return;
    }

    // The outbox row and the build row are written in the same transaction so a build
    // promoted to a baseline mid-page still fails the cascade's FK and rolls back both,
    // instead of leaving an outbox entry for storage that was never actually orphaned.
    await dbClient.transaction(async (tx) => {
      await dbClient.storageOutbox.insertMany(
        tx,
        buildIds.map((buildId) => ({
          projectId,
          buildId,
          prefix: getBuildPrefix(projectId, buildId),
        })),
      );
      await dbClient.builds.removeMany(tx, buildIds);
    });

    await drainStorageOutbox(projectId);

    if (buildIds.length < RETENTION_PAGE_SIZE) {
      return;
    }
  }

  console.warn(
    `purgeExpiredBuilds: hit the ${MAX_PAGES_PER_RUN}-page safety cap for project ${projectId} ` +
      "before exhausting expired builds; remaining builds will be purged on the next run.",
  );
};
