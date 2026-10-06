"use server";

import { ORPCError } from "@orpc/client";

import {
  getFlakyDetectionLastRunAt,
  getFlakyDetectionSettings,
  runFlakyDetectionNow,
  saveFlakyDetectionSettings,
} from "@ovr/builds/flakiness";

import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const getFlakyDetection = os.jobs.getFlakyDetection
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async () => ({
    settings: await getFlakyDetectionSettings(),
    lastRunAt: await getFlakyDetectionLastRunAt(),
  }))
  .actionable();

export const updateFlakyDetection = os.jobs.updateFlakyDetection
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const result = await saveFlakyDetectionSettings(input, context.user.id);

    if (result.status === "error") {
      throw new ORPCError("SERVICE_UNAVAILABLE", { message: "the job queue is unavailable" });
    }
  })
  .actionable();

export const runFlakyDetection = os.jobs.runFlakyDetection
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async () => {
    const result = await runFlakyDetectionNow();

    if (result.status === "error") {
      throw new ORPCError("SERVICE_UNAVAILABLE", { message: "the job queue is unavailable" });
    }
  })
  .actionable();
