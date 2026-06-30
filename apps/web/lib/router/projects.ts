"use server";

import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";
import { revalidatePath } from "next/cache";

import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { os } from "./os";

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
  .handler(async ({ input, context }) => {
    const { limit = 20, offset = 0 } = input ?? {};

    const projects = await dbClient.projects.listProjects({
      organizationId: context.organizationId,
      limit,
      offset,
    });

    return { projects };
  })
  .actionable();

export const count = os.projects.count
  .use(authenticatedMiddleware)
  .handler(async ({ context }) => {
    const total = await dbClient.projects.countProjects({
      organizationId: context.organizationId,
    });

    return { total };
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
      organizationId: context.organizationId,
      creatorId: context.user.id,
    });

    if (!project) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to add project" });
    }

    revalidatePath("/", "layout");

    return { projectId: project.id };
  })
  .actionable();

export const update = os.projects.update
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const project = await dbClient.projects.getProject({
      projectId: input.id,
      organizationId: context.organizationId,
    });

    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    await dbClient.projects.updateProject(input.id, input.patch);
  })
  .actionable();
