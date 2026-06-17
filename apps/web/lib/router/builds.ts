"use server";

import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";
import { createBuild as createBuildService, getArtifactPath } from "@ovr/services/builds";
import { storage } from "@ovr/storage";

import { os } from "./os";
import { apiKeyMiddleware, authenticatedMiddleware } from "./middleware";

const UPLOAD_URL_TTL_SECONDS = 3600;

export const createBuild = os.builds.createBuild
  .use(apiKeyMiddleware)
  .handler(async ({ input, context }) => {
    const result = await createBuildService(
      {
        projectId: context.projectId,
        branch: input.branch,
        commitSha: input.commitSha,
        name: input.name,
        author: input.author,
        targets: input.targets,
      },
      context.apiKey.referenceId,
    );

    if (result.status === "error") {
      throw new ORPCError("NOT_FOUND");
    }

    const uploadUrl = await storage.getPresignedUploadUrl(
      getArtifactPath(result.data),
      UPLOAD_URL_TTL_SECONDS,
    );

    return { buildId: result.data, uploadUrl };
  })
  .actionable();

export const getBuildStatus = os.builds.getBuildStatus
  .use(apiKeyMiddleware)
  .handler(async ({ input, context }) => {
    const build = await dbClient.builds.findById(input.buildId);

    if (!build) {
      throw new ORPCError("NOT_FOUND");
    }

    if (build.projectId !== context.projectId) {
      throw new ORPCError("FORBIDDEN");
    }

    if (build.status === "needs_review") {
      const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
      return {
        status: build.status,
        reviewUrl: `${baseUrl}/projects/${build.projectId}/builds/${build.id}`,
      };
    }

    return { status: build.status };
  })
  .actionable();

export const list = os.builds.list
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const { projectIds, status, sortDirection = "desc", limit = 20, offset = 0 } = input ?? {};

    const { builds: rows, total } = await dbClient.builds.findAll({
      organizationId: context.organizationId,
      projectIds,
      status,
      sortDirection,
      limit,
      offset,
    });

    return {
      builds: rows.map((build) => ({
        id: build.id,
        project: { id: build.projectId, name: build.projectName },
        branch: build.branch,
        commitSha: build.commitSha,
        name: build.name,
        author: build.author,
        status: build.status,
        createdAt: build.createdAt,
      })),
      total,
    };
  })
  .actionable();
