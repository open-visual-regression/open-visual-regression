import { dbClient } from "@ovr/db/client";
import { createLogger } from "@ovr/logger";
import type { CanceledBuildJobs } from "@ovr/queue";
import { cancelBuildJobs, findBuildsWithLiveJobs } from "@ovr/queue/producer";

import { publishStatus } from "./builds";

const logger = createLogger("builds");

const REAPER_BATCH_LIMIT = 100;

const minutesSince = (timestamp: string): number =>
  Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000);

export const resolveStaleBuilds = async (staleMinutes: number): Promise<void> => {
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000).toISOString();
  const idleBuildIds = await dbClient.builds.findStale(cutoff, REAPER_BATCH_LIMIT);

  if (idleBuildIds.length === 0) {
    return;
  }

  // Throws if Redis is down, so an outage never reads as "no jobs left".
  const waitingBuildIds = await findBuildsWithLiveJobs(
    await Promise.all(
      idleBuildIds.map(async (buildId) => ({
        buildId,
        diffIds: await dbClient.diffs.findPendingIds(buildId),
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

  for (const buildId of idleBuildIds.filter((id) => !waitingBuildIds.has(id))) {
    const build = await dbClient.builds.findById(buildId);
    const diffIds = await dbClient.transaction(async (tx) => {
      const erroredSnapshotIds = await dbClient.snapshots.markUnfinishedAs(buildId, "error", tx);
      const erroredDiffIds = await dbClient.diffs.markPendingAs(buildId, "error", tx);
      await dbClient.diffs.createMany({
        values: erroredSnapshotIds.map((snapshotId) => ({ snapshotId, processingStatus: "error" })),
        tx,
      });
      await dbClient.builds.updateProcessingStatus(
        buildId,
        "error",
        `Build timed out: no processing activity for ${staleMinutes} minutes`,
        tx,
      );
      return erroredDiffIds;
    });

    logger.warn(
      {
        buildId,
        projectId: build?.projectId,
        ageMinutes: build ? minutesSince(build.createdAt) : undefined,
        staleMinutes,
        reason: "no snapshot or diff activity and no queued or running jobs",
      },
      "reaped stale build",
    );

    reaped.push({ buildId, diffIds });
    await publishStatus(buildId);
  }

  try {
    await cancelBuildJobs(reaped);
  } catch (error) {
    logger.error({ err: error }, "failed to remove queued jobs for reaped builds");
  }
};
