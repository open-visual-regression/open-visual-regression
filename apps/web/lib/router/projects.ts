"use server";

import { os } from "./os";
import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";

export const getOne = os.projects.getOne
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const project = await dbClient.projects.getProject({
      projectId: input.projectId,
      organizationId: context.organizationId,
    });

    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    return { project };
  })
  .actionable();

export const list = os.projects.list
  .use(authenticatedMiddleware)
  .handler(async ({ context }) => {
    const projects = await dbClient.projects.listProjects({
      organizationId: context.organizationId,
    });

    return { projects };
  })
  .actionable();

export const add = os.projects.add
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const project = await dbClient.projects.addProject({
      name: input.projectName,
      description: input.projectDescription,
      gitMainBranch: input.gitMainBranch,
      diffThreshold: input.diffThreshold,
      organizationId: context.organizationId,
      creatorId: context.user.id,
    });

    if (!project) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to add project" });
    }

    return { projectId: project.id };
  })
  .actionable();
