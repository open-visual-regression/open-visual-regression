"use server";

import { ORPCError } from "@orpc/client";

import { findBaselineBuild } from "@ovr/builds/builds";
import { dbClient } from "@ovr/db/client";

import { getStorybookPath } from "@/lib/utils/storage";

import { authenticatedMiddleware } from "./middleware";
import { os } from "./os";

const getBaselineBuildId = async (projectId: string, organizationId: string) => {
  const project = await dbClient.projects.getProject({ projectId, organizationId });

  if (!project) {
    throw new ORPCError("NOT_FOUND", { message: "Project not found" });
  }

  const build = await findBaselineBuild(project);

  if (!build) {
    throw new ORPCError("NOT_FOUND", { message: "Baseline build not found" });
  }

  return build.id;
};

const redirectTo = (location: string) => ({
  status: 302 as const,
  headers: { location, "cache-control": "no-store" },
});

export const getBuild = os.baseline.getBuild
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const buildId = await getBaselineBuildId(input.projectId, context.organizationId);

    return redirectTo(`/projects/${input.projectId}/builds/${buildId}`);
  })
  .actionable();

export const getStorybook = os.baseline.getStorybook
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const buildId = await getBaselineBuildId(input.projectId, context.organizationId);
    const search = input.path ? `?${new URLSearchParams({ path: input.path })}` : "";

    return redirectTo(`${getStorybookPath(buildId)}${search}`);
  })
  .actionable();
