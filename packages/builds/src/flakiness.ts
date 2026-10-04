import { z } from "zod";

import { DEFAULT_FLAKY_DETECTION_SETTINGS, cronPatternSchema } from "@ovr/api/contracts/jobs";
import { dbClient } from "@ovr/db/client";
import { createLogger } from "@ovr/logger";
import { enqueueFlakySnapshotScanMany } from "@ovr/queue/producer";

const logger = createLogger("builds");

const {
  cron: DEFAULT_FLAKY_DETECTION_CRON,
  windowBuilds,
  minReverts,
  minSamples,
  minChangeRate,
} = DEFAULT_FLAKY_DETECTION_SETTINGS;

const settings = z.object({
  windowBuilds: z.coerce.number().int().positive().catch(windowBuilds),
  minReverts: z.coerce.number().int().positive().catch(minReverts),
  minSamples: z.coerce.number().int().min(2).catch(minSamples),
  minChangeRate: z.coerce.number().positive().max(1).catch(minChangeRate),
});

export const isFlakyDetectionEnabled = (): boolean =>
  z.stringbool().catch(false).parse(process.env.OVR_FLAKY_DETECTION_ENABLED);

export const getFlakyDetectionCron = (): string =>
  cronPatternSchema
    .default(DEFAULT_FLAKY_DETECTION_CRON)
    .catch(({ input }) => {
      logger.warn(
        { pattern: input, fallback: DEFAULT_FLAKY_DETECTION_CRON },
        "OVR_FLAKY_DETECTION_CRON is not a valid cron pattern, using the default",
      );
      return DEFAULT_FLAKY_DETECTION_CRON;
    })
    .parse(process.env.OVR_FLAKY_DETECTION_CRON || undefined);

export const dispatchFlakySnapshotScans = async (): Promise<void> => {
  if (!isFlakyDetectionEnabled()) {
    return;
  }

  const projectIds = await dbClient.projects.findIdsNeedingFlakyScan();
  await enqueueFlakySnapshotScanMany(projectIds.map((projectId) => ({ projectId })));
};

export const scanFlakySnapshots = async (projectId: string): Promise<void> => {
  await dbClient.flakySnapshots.recomputeForProject(
    projectId,
    settings.parse({
      windowBuilds: process.env.OVR_FLAKY_DETECTION_WINDOW_BUILDS,
      minReverts: process.env.OVR_FLAKY_DETECTION_MIN_REVERTS,
      minSamples: process.env.OVR_FLAKY_DETECTION_MIN_SAMPLES,
      minChangeRate: process.env.OVR_FLAKY_DETECTION_MIN_CHANGE_RATE,
    }),
  );
};
