"use server";

import { getDiffSettings, saveDiffSettings } from "@ovr/reviews/diffSettings";

import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const getDiff = os.settings.getDiff
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async () => ({ settings: await getDiffSettings() }))
  .actionable();

export const updateDiff = os.settings.updateDiff
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(({ input, context }) => saveDiffSettings(input, context.user.id))
  .actionable();
