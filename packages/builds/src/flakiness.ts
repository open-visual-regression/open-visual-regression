import {
  storedFlakyDetectionSettingsSchema,
  type FlakyDetectionSettings,
} from "@ovr/api/contracts/jobs";
import { dbClient } from "@ovr/db/client";
import { QueueUnavailableError, scheduleJob, type RedisConnection } from "@ovr/queue";
import { enqueueFlakySnapshotScanMany, scheduleJob as rescheduleJob } from "@ovr/queue/producer";

import type { Result } from "./types";

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

// The settings are saved even when the queue is unavailable; the worker applies
// the saved schedule the next time it starts.
export const saveFlakyDetectionSettings = async (
  settings: FlakyDetectionSettings,
  updatedBy: string,
): Promise<Result<undefined, "QUEUE_UNAVAILABLE">> => {
  await dbClient.jobSettings.upsert({ job: "flaky_detection", settings, updatedBy });

  try {
    await rescheduleJob("flaky_detection", settings.enabled ? settings.cron : null);
  } catch (error) {
    if (error instanceof QueueUnavailableError) {
      return { status: "error", error: "QUEUE_UNAVAILABLE" };
    }
    throw error;
  }

  return { status: "ok", data: undefined };
};

export const dispatchFlakySnapshotScans = async (): Promise<void> => {
  if (!(await isFlakyDetectionEnabled())) {
    return;
  }

  const projectIds = await dbClient.projects.findIdsNeedingFlakyScan();
  await enqueueFlakySnapshotScanMany(projectIds.map((projectId) => ({ projectId })));
};

export const scanFlakySnapshots = async (projectId: string): Promise<void> => {
  const { windowBuilds, minReverts, minSamples, minChangeRate } = await getFlakyDetectionSettings();

  await dbClient.flakySnapshots.recomputeForProject(projectId, {
    windowBuilds,
    minReverts,
    minSamples,
    minChangeRate,
  });
};
