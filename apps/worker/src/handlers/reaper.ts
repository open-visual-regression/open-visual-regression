import { z } from "zod";

import { resolveStaleBuilds } from "@ovr/builds/reaper";
import type { ReaperJobPayload } from "@ovr/queue";

const REAPER_STALE_MINUTES = z.coerce
  .number()
  .int()
  .positive()
  .catch(30)
  .parse(process.env.OVR_REAPER_STALE_MINUTES);

type ReaperJob = { data: ReaperJobPayload };

export const run = async (_job: ReaperJob): Promise<void> => {
  await resolveStaleBuilds(REAPER_STALE_MINUTES);
};

export const failed = async (_job: ReaperJob, error?: Error): Promise<void> => {
  console.error("Reaper job failed:", error);
};
