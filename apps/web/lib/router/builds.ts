"use server";

import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";
import { createBuild as createBuildService, getArtifactPath } from "@ovr/services/builds";
import { storage } from "@ovr/storage";

import { os } from "./os";
import { apiKeyMiddleware } from "./middleware";

const UPLOAD_URL_TTL_SECONDS = 3600;

export const createBuild = os.builds.createBuild
  .use(apiKeyMiddleware)
  .handler(async ({ input, context }) => {
    const result = await createBuildService(
      {
        projectId: context.projectId,
        branch: input.branch,
        commitSha: input.commitSha,
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
