"use server";

import {
  getDiffSettings as getStoredDiffSettings,
  saveDiffSettings,
} from "@ovr/builds/diffSettings";

import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const getDiffSettings = os.settings.getDiffSettings
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async () => ({ settings: await getStoredDiffSettings() }))
  .actionable();

export const updateDiffSettings = os.settings.updateDiffSettings
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(({ input, context }) => saveDiffSettings(input, context.user.id))
  .actionable();
