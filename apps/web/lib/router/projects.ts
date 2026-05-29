"use server";

import { os } from "./os";
import { authenticatedMiddleware } from "./middleware";
import { ORPCError } from "@orpc/client";
import { ProjectCreatorDto, ProjectDto } from "@ovr/api/contracts/projects";
import { ProjectCreatorDbSchema, ProjectDbSchema } from "@ovr/db/repository/projects";
import { dbClient } from "@ovr/db/client";

const toCreatorDto = (creator: ProjectCreatorDbSchema): ProjectCreatorDto => ({
  id: creator.id,
  name: creator.name,
  email: creator.email,
});

const toProjectDto = (project: ProjectDbSchema): ProjectDto => ({
  id: project.id,
  name: project.name,
  description: project.description,
  gitMainBranch: project.gitMainBranch,
  diffThreshold: project.diffThreshold,
  createdBy: toCreatorDto(project.creator),
  createdAt: project.createdAt,
});

export const list = os.projects.list
  .use(authenticatedMiddleware)
  .handler(async () => {
    const projects = await dbClient.projects.listProjects();
    return { projects: projects.map(toProjectDto) };
  })
  .actionable();

export const add = os.projects.add
  .use(authenticatedMiddleware)
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
