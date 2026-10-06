import {
  storedFlakyDetectionSettingsSchema,
  type FlakyDetection,
  type FlakyDetectionSettings,
} from "@ovr/api/contracts/jobs";
import { dbClient } from "@ovr/db/client";
import { QueueUnavailableError, scheduleJob, type RedisConnection } from "@ovr/queue";
import {
  enqueueFlakySnapshotDispatch,
  enqueueFlakySnapshotScanMany,
  isJobRunning,
  scheduleJob as rescheduleJob,
} from "@ovr/queue/producer";

import type { Result } from "./types";

const FLAKY_THRESHOLDS = { minReverts: 2, minSamples: 10, minChangeRate: 0.5 };

export const getFlakyDetectionSettings = async (): Promise<FlakyDetectionSettings> => {
  const stored = await dbClient.jobSettings.find("flaky_detection");
  return storedFlakyDetectionSettingsSchema.parse(stored?.settings);
};

const isFlakyDetectionRunning = async (): Promise<boolean> => {
  try {
    return await isJobRunning("flaky_detection");
  } catch (error) {
    if (error instanceof QueueUnavailableError) {
      return false;
    }
    throw error;
  }
};

export const getFlakyDetection = async (): Promise<FlakyDetection> => {
  const [stored, running] = await Promise.all([
    dbClient.jobSettings.find("flaky_detection"),
    isFlakyDetectionRunning(),
  ]);

  return {
    settings: storedFlakyDetectionSettingsSchema.parse(stored?.settings),
    lastRunAt: stored?.lastRunAt ?? null,
    running,
  };
};

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

export const runFlakyDetectionNow = async (): Promise<
  Result<undefined, "DISABLED" | "ALREADY_RUNNING" | "QUEUE_UNAVAILABLE">
> => {
  if (!(await isFlakyDetectionEnabled())) {
    return { status: "error", error: "DISABLED" };
  }

  try {
    if (await isJobRunning("flaky_detection")) {
      return { status: "error", error: "ALREADY_RUNNING" };
    }

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
  if (!(await isFlakyDetectionEnabled())) {
    return;
  }

  const projectIds = await dbClient.projects.findIdsNeedingFlakyScan();
  await enqueueFlakySnapshotScanMany(projectIds.map((projectId) => ({ projectId })));
  await dbClient.jobSettings.markRun("flaky_detection");
};

export const scanFlakySnapshots = async (projectId: string): Promise<void> => {
  const { windowBuilds } = await getFlakyDetectionSettings();

  await dbClient.flakySnapshots.recomputeForProject(projectId, {
    windowBuilds,
    ...FLAKY_THRESHOLDS,
  });
};
