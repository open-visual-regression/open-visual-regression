import {
  storedFlakyDetectionSettingsSchema,
  type FlakyDetectionSettings,
} from "@ovr/api/contracts/jobs";
import { dbClient } from "@ovr/db/client";
import { QueueUnavailableError, scheduleJob, type RedisConnection } from "@ovr/queue";
import {
  enqueueFlakySnapshotDispatch,
  enqueueFlakySnapshotScanMany,
  scheduleJob as rescheduleJob,
} from "@ovr/queue/producer";

import type { Result } from "./types";

const FLAKY_THRESHOLDS = { minReverts: 2, minSamples: 10, minChangeRate: 0.5 };

export const getFlakyDetectionSettings = async (): Promise<FlakyDetectionSettings> => {
  const stored = await dbClient.jobSettings.find("flaky_detection");
  return storedFlakyDetectionSettingsSchema.parse(stored?.settings);
};

export const getFlakyDetectionLastRunAt = async (): Promise<string | null> =>
  (await dbClient.jobSettings.find("flaky_detection"))?.lastRunAt ?? null;

export const isFlakyDetectionEnabled = async (): Promise<boolean> =>
  (await getFlakyDetectionSettings()).enabled;

export const scheduleFlakyDetection = async (connection: RedisConnection): Promise<void> => {
  const { enabled, cron } = await getFlakyDetectionSettings();
  await scheduleJob(connection, "flaky_detection", enabled ? cron : null);
};

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

export const runFlakyDetectionNow = async (): Promise<Result<undefined, "QUEUE_UNAVAILABLE">> => {
  try {
    await enqueueFlakySnapshotDispatch();
  } catch (error) {
    if (error instanceof QueueUnavailableError) {
      return { status: "error", error: "QUEUE_UNAVAILABLE" };
    }
    throw error;
  }

  return { status: "ok", data: undefined };
};

export const dispatchFlakySnapshotScans = async (): Promise<void> => {
  const settings = await getFlakyDetectionSettings();

  if (!settings.enabled) {
    return;
  }

  await dbClient.jobSettings.markRun("flaky_detection", settings);

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
