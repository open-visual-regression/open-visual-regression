"use server";

import { ORPCError } from "@orpc/client";

import {
  getFlakyDetection as getFlakyDetectionState,
  runFlakyDetectionNow,
  saveFlakyDetectionSettings,
} from "@ovr/builds/flakiness";

import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const getFlakyDetection = os.jobs.getFlakyDetection
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(() => getFlakyDetectionState())
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

    if (result.status === "ok") {
      return;
    }

    switch (result.error) {
      case "DISABLED":
        throw new ORPCError("PRECONDITION_FAILED", { message: "flaky detection is disabled" });
      case "ALREADY_RUNNING":
        throw new ORPCError("CONFLICT", { message: "flaky detection is already running" });
      case "QUEUE_UNAVAILABLE":
        throw new ORPCError("SERVICE_UNAVAILABLE", { message: "the job queue is unavailable" });
    }
  })
  .actionable();
