import { dbClient } from "@ovr/db/client";
import { createLogger } from "@ovr/logger";
import { enqueuePurgeMany } from "@ovr/queue/producer";
import { storage } from "@ovr/storage";

import { mapWithConcurrency } from "./lib/concurrency";

const logger = createLogger("builds");

const RETENTION_PAGE_SIZE = 500;
const STORAGE_DELETE_CONCURRENCY = 10;
const MAX_PAGES_PER_RUN = 200;

const getBuildPrefix = (projectId: string, buildId: string): string =>
  `${projectId}/builds/${buildId}/`;

export const dispatchPurgeJobs = async (): Promise<void> => {
  const organizations = await dbClient.organizations.findAll();
  const errors: unknown[] = [];

  for (const organization of organizations) {
    try {
      const projects = await dbClient.projects.listProjects({ organizationId: organization.id });

      await enqueuePurgeMany(projects.map((project) => ({ projectId: project.id })));
    } catch (error) {
      logger.error(
        { err: error, organizationId: organization.id },
        "failed to dispatch purge jobs for organization",
      );
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
    logger.error(
      {
        errs: failures.map((failure) => failure.error),
        projectId,
        prefixes: failures.map((failure) => failure.entry.prefix),
      },
      "failed to delete storage for purged builds; will retry on the next run",
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

  logger.warn(
    { projectId, maxPages: MAX_PAGES_PER_RUN },
    "hit the page safety cap before exhausting expired builds; the rest purge on the next run",
  );
};
