import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { mapWithConcurrency } from "./lib/concurrency";
import { enqueuePurgeMany } from "./lib/queue";

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

    // Builds are removed from the DB before their storage objects so that a build which is
    // promoted to a baseline mid-page is protected: the cascading delete is rejected by the
    // baselines FK and that build's storage prefix is never touched. Once the DB row is gone,
    // findExpiredPage can never see that buildId again, so a storage delete failure here is
    // unrecoverable — failures are logged individually (not aborting the rest of the page)
    // so an orphaned prefix is at least discoverable for manual cleanup.
    await dbClient.builds.removeMany(buildIds);

    const deleteResults = await mapWithConcurrency(
      buildIds,
      STORAGE_DELETE_CONCURRENCY,
      async (buildId) => {
        try {
          await storage.deletePrefix(getBuildPrefix(projectId, buildId));
          return { buildId, ok: true as const };
        } catch (error) {
          return { buildId, ok: false as const, error };
        }
      },
    );

    const failures = deleteResults.filter((result) => !result.ok);

    if (failures.length > 0) {
      console.error(
        `purgeExpiredBuilds: failed to delete storage for ${failures.length} purged build(s) in ` +
          `project ${projectId} (DB rows already removed, manual storage cleanup required): ` +
          failures.map((failure) => getBuildPrefix(projectId, failure.buildId)).join(", "),
        failures.map((failure) => failure.error),
      );
    }

    if (buildIds.length < RETENTION_PAGE_SIZE) {
      return;
    }
  }

  console.warn(
    `purgeExpiredBuilds: hit the ${MAX_PAGES_PER_RUN}-page safety cap for project ${projectId} ` +
      "before exhausting expired builds; remaining builds will be purged on the next run.",
  );
};
