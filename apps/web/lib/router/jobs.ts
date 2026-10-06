"use server";

import { ORPCError } from "@orpc/client";

import { getFlakyDetectionSettings, saveFlakyDetectionSettings } from "@ovr/builds/flakiness";

import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const getFlakyDetection = os.jobs.getFlakyDetection
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async () => ({ settings: await getFlakyDetectionSettings() }))
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
