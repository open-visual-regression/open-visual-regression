"use server";

import { ORPCError } from "@orpc/client";
import { revalidatePath } from "next/cache";

import { deleteProject as deleteProjectService } from "@ovr/builds/projects";
import { dbClient } from "@ovr/db/client";

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
    const { limit = 20, cursor } = input ?? {};

    const { projects, nextCursor } = await dbClient.projects.findAll({
      organizationId: context.organizationId,
      limit,
      cursor,
    });

    return { projects, nextCursor };
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

export const deleteProject = os.projects.deleteProject
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async ({ input, context }) => {
    const result = await deleteProjectService(input.id, context.organizationId);

    if (result.status === "error") {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    revalidatePath("/", "layout");
  })
  .actionable();
