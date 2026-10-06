import {
  storedFlakyDetectionSettingsSchema,
  type FlakyDetectionSettings,
} from "@ovr/api/contracts/jobs";
import { dbClient } from "@ovr/db/client";
import { scheduleJob, type RedisConnection } from "@ovr/queue";
import { enqueueFlakySnapshotScanMany } from "@ovr/queue/producer";

const FLAKY_THRESHOLDS = { minReverts: 2, minSamples: 10, minChangeRate: 0.5 };

export const getFlakyDetectionSettings = async (): Promise<FlakyDetectionSettings> => {
  const stored = await dbClient.jobSettings.find("flaky_detection");
  return storedFlakyDetectionSettingsSchema.parse(stored?.settings);
};

export const isFlakyDetectionEnabled = async (): Promise<boolean> =>
  (await getFlakyDetectionSettings()).enabled;

export const scheduleFlakyDetection = async (connection: RedisConnection): Promise<void> => {
  const { enabled, cron } = await getFlakyDetectionSettings();
  await scheduleJob(connection, "flaky_detection", enabled ? cron : null);
};

export const dispatchFlakySnapshotScans = async (): Promise<void> => {
  if (!(await isFlakyDetectionEnabled())) {
    return;
  }

  const projectIds = await dbClient.projects.findIdsNeedingFlakyScan();
  await enqueueFlakySnapshotScanMany(projectIds.map((projectId) => ({ projectId })));
};

export const scanFlakySnapshots = async (projectId: string): Promise<void> => {
  const { windowBuilds } = await getFlakyDetectionSettings();

  await dbClient.flakySnapshots.recomputeForProject(projectId, {
    windowBuilds,
    ...FLAKY_THRESHOLDS,
  });
};
