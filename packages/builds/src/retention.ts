import { setTimeout as sleep } from "node:timers/promises";

import { dbClient } from "@ovr/db/client";
import { createLogger } from "@ovr/logger";
import { enqueuePurgeMany } from "@ovr/queue/producer";
import { storage } from "@ovr/storage";

import { mapWithConcurrency } from "./lib/concurrency";

const logger = createLogger("builds");

const STORAGE_DELETE_CONCURRENCY = 10;

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

export type PurgeOptions = {
  batchSize?: number;
  batchPauseMs?: number;
  timeBudgetMs?: number;
};

export const DEFAULT_PURGE_OPTIONS = {
  batchSize: 10,
  batchPauseMs: 500,
  timeBudgetMs: 10 * 60 * 1000,
} as const satisfies Required<PurgeOptions>;

export const purgeExpiredBuilds = async (
  projectId: string,
  options: PurgeOptions = {},
): Promise<void> => {
  const { batchSize, batchPauseMs, timeBudgetMs } = { ...DEFAULT_PURGE_OPTIONS, ...options };
  const project = await dbClient.projects.findById(projectId);

  if (!project) {
    return;
  }

  const startedAt = Date.now();
  let buildsPurged = 0;
  let batches = 0;
  let hitTimeBudget = false;

  // Retry storage deletes left over from a previous run before paging through new ones.
  await drainStorageOutbox(projectId);

  const cutoff = new Date(Date.now() - project.retentionDays * 24 * 60 * 60 * 1000).toISOString();

  for (;;) {
    const buildIds = await dbClient.builds.findExpiredPage(projectId, cutoff, batchSize);

    if (buildIds.length === 0) {
      break;
    }

    // The outbox row and the build row are written in the same transaction so a build
    // promoted to a baseline mid-batch still fails the cascade's FK and rolls back both,
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

    buildsPurged += buildIds.length;
    batches++;

    await drainStorageOutbox(projectId);

    if (buildIds.length < batchSize) {
      break;
    }

    if (Date.now() - startedAt >= timeBudgetMs) {
      hitTimeBudget = true;
      break;
    }

    await sleep(batchPauseMs);
  }

  const summary = {
    projectId,
    buildsPurged,
    batches,
    durationMs: Date.now() - startedAt,
    hitTimeBudget,
  };

  if (hitTimeBudget) {
    logger.warn(
      { ...summary, timeBudgetMs },
      "purge hit its time budget before exhausting expired builds; the rest purge on the next run",
    );
  } else {
    logger.info(summary, "purged expired builds");
  }
};
