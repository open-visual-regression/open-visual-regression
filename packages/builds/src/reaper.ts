import { dbClient } from "@ovr/db/client";
import { createLogger } from "@ovr/logger";
import type { CanceledBuildJobs } from "@ovr/queue";
import { cancelBuildJobs } from "@ovr/queue/producer";

import { publishStatus } from "./builds";

const logger = createLogger("builds");

const REAPER_BATCH_LIMIT = 100;

export const resolveStaleBuilds = async (staleMinutes: number): Promise<void> => {
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000).toISOString();
  const staleBuildIds = await dbClient.builds.findStale(cutoff, REAPER_BATCH_LIMIT);

  const reaped: CanceledBuildJobs[] = [];

  for (const buildId of staleBuildIds) {
    const diffIds = await dbClient.transaction(async (tx) => {
      await dbClient.snapshots.markUnfinishedAs(buildId, "error", tx);
      const erroredDiffIds = await dbClient.diffs.markPendingAs(buildId, "error", tx);
      await dbClient.builds.updateProcessingStatus(
        buildId,
        "error",
        `Build timed out: no processing activity for ${staleMinutes} minutes`,
        tx,
      );
      return erroredDiffIds;
    });

    reaped.push({ buildId, diffIds });
    await publishStatus(buildId);
  }

  try {
    await cancelBuildJobs(reaped);
  } catch (error) {
    logger.error({ err: error }, "failed to remove queued jobs for reaped builds");
  }
};
