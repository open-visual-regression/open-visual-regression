import { dbClient } from "@ovr/db/client";

const REAPER_BATCH_LIMIT = 100;

export const resolveStaleBuilds = async (staleMinutes: number): Promise<void> => {
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000).toISOString();
  const staleBuildIds = await dbClient.builds.findStale(cutoff, REAPER_BATCH_LIMIT);

  for (const buildId of staleBuildIds) {
    await dbClient.transaction(async (tx) => {
      await dbClient.snapshots.markStuckAsError(buildId, tx);
      await dbClient.diffs.markStuckAsErrorForBuild(buildId, tx);
      await dbClient.builds.updateProcessingStatus(
        buildId,
        "error",
        `Build timed out: no processing activity for ${staleMinutes} minutes`,
        tx,
      );
    });
  }
};
