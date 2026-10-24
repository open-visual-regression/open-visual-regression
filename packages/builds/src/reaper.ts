import { dbClient } from "@ovr/db/client";
import type { BuildsCursor, StaleBuild } from "@ovr/db/repository/builds";
import { createLogger } from "@ovr/logger";
import type { CanceledBuildJobs } from "@ovr/queue";
import { cancelBuildJobs, findBuildsWithLiveJobs } from "@ovr/queue/producer";

import { publishStatus } from "./builds";

const logger = createLogger("builds");

const REAPER_BATCH_LIMIT = 100;

const minutesSince = (timestamp: string): number =>
  Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000);

const reapIdleBuilds = async (
  idleBuilds: StaleBuild[],
  staleMinutes: number,
): Promise<CanceledBuildJobs[]> => {
  // Throws if Redis is down, so an outage never reads as "no jobs left".
  const waitingBuildIds = await findBuildsWithLiveJobs(
    await Promise.all(
      idleBuilds.map(async ({ id }) => ({
        buildId: id,
        diffIds: await dbClient.diffs.findPendingIds(id),
      })),
    ),
  );

  if (waitingBuildIds.size > 0) {
    logger.info(
      { buildIds: [...waitingBuildIds], staleMinutes },
      "idle builds still have queued or running jobs; not reaping them",
    );
  }

  const reaped: CanceledBuildJobs[] = [];

  for (const build of idleBuilds.filter(({ id }) => !waitingBuildIds.has(id))) {
    const diffIds = await dbClient.transaction(async (tx) => {
      const erroredSnapshotIds = await dbClient.snapshots.markUnfinishedAs(build.id, "error", tx);
      const erroredDiffIds = await dbClient.diffs.markPendingAs(build.id, "error", tx);
      await dbClient.diffs.createMany({
        values: erroredSnapshotIds.map((snapshotId) => ({ snapshotId, processingStatus: "error" })),
        tx,
      });
      await dbClient.builds.updateProcessingStatus(
        build.id,
        "error",
        `Build timed out: no processing activity for ${staleMinutes} minutes`,
        tx,
      );
      return erroredDiffIds;
    });

    logger.warn(
      {
        buildId: build.id,
        projectId: build.projectId,
        ageMinutes: minutesSince(build.createdAt),
        staleMinutes,
        reason: "no snapshot or diff activity and no queued or running jobs",
      },
      "reaped stale build",
    );

    reaped.push({ buildId: build.id, diffIds });
    await publishStatus(build.id);
  }

  return reaped;
};

export const resolveStaleBuilds = async (staleMinutes: number): Promise<void> => {
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000).toISOString();
  const reaped: CanceledBuildJobs[] = [];
  let after: BuildsCursor | undefined;

  // Builds still waiting on their jobs stay idle and are skipped, so page past them instead of
  // rereading the same batch every run and never reaching the orphaned builds behind it.
  for (;;) {
    const idleBuilds = await dbClient.builds.findStale(cutoff, REAPER_BATCH_LIMIT, after);

    if (idleBuilds.length === 0) {
      break;
    }

    reaped.push(...(await reapIdleBuilds(idleBuilds, staleMinutes)));

    if (idleBuilds.length < REAPER_BATCH_LIMIT) {
      break;
    }

    after = idleBuilds.at(-1);
  }

  try {
    await cancelBuildJobs(reaped);
  } catch (error) {
    logger.error({ err: error }, "failed to remove queued jobs for reaped builds");
  }
};
