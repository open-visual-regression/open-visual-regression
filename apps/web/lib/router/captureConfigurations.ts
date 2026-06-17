"use server";

import { os } from "./os";
import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";

export const list = os.captureConfigurations.list
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const [project, configs] = await Promise.all([
      dbClient.projects.getProject({
        projectId: input.projectId,
        organizationId: context.organizationId,
      }),
      dbClient.captureConfigurations.findByProject({ projectId: input.projectId }),
    ]);

    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    return {
      captureConfigurations: configs.map(
        ({ id, name, browser, viewportWidth, viewportHeight }) => ({
          id,
          name,
          browser: browser as "chromium" | "firefox" | "webkit",
          viewportWidth,
          viewportHeight,
        }),
      ),
    };
  })
  .actionable();

export const add = os.captureConfigurations.add
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const [project, count] = await Promise.all([
      dbClient.projects.getProject({
        projectId: input.projectId,
        organizationId: context.organizationId,
      }),
      dbClient.captureConfigurations.countByProject(input.projectId),
    ]);

    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    if (count >= 10) {
      throw new ORPCError("BAD_REQUEST", {
        message: "capture configuration limit of 10 reached",
      });
    }

    await dbClient.captureConfigurations.addCaptureConfiguration({
      projectId: input.projectId,
      ...input.data,
    });
  })
  .actionable();

export const remove = os.captureConfigurations.remove
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const config = await dbClient.captureConfigurations.findById(input.captureConfigurationId);

    if (!config) {
      throw new ORPCError("NOT_FOUND", { message: "Capture configuration not found" });
    }

    const project = await dbClient.projects.getProject({
      projectId: config.projectId,
      organizationId: context.organizationId,
    });

    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Capture configuration not found" });
    }

    await dbClient.captureConfigurations.deleteCaptureConfiguration(input.captureConfigurationId);
  })
  .actionable();
